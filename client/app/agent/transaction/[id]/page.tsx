/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/agent/transaction/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Send, Home } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import { ConnectButton, DisconnectButton } from "@/lib/Connect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { TransactionSuccess } from "@/components/TransactionSuccess";
import CommandList from "@/components/ui/command";

interface Message {
  role: string;
  id: string;
  content: string;
  timestamp: string;
  user: string;
  transaction?: {
    data: {
      transactions: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }>;
      fromToken?: any;
      toToken?: any;
      fromAmount?: string;
      toAmount?: string;
      receiver?: string;
      gasCostUSD?: string;
      solver?: string;
    };
    type: string;
  };
}

interface TransactionHandlerProps {
  transactions: Array<{
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  }>;
  description: string;
  onSuccess: (hash: string) => void;
  onError: (error: any) => void;
}

interface MessageContentProps {
  message: Message;
  onTransactionSuccess: (hash: string) => void;
}

const TransactionHandler: React.FC<TransactionHandlerProps> = ({
  transactions,
  description,
  onSuccess,
  onError,
}) => {
  const { account } = useAccount();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const executeTransaction = async () => {
    if (!account) {
      onError(new Error('Wallet not connected'));
      return;
    }

    setIsProcessing(true);
    try {
      for (const tx of transactions) {
        const response = await account.execute({
          contractAddress: tx.contractAddress,
          entrypoint: tx.entrypoint,
          calldata: tx.calldata
        });
        await account.waitForTransaction(response.transaction_hash);
        if (tx === transactions[transactions.length - 1]) {
          onSuccess(response.transaction_hash);
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
      <p className="text-sm text-white/80 mb-4">{description}</p>
      <button
        onClick={executeTransaction}
        disabled={isProcessing}
        className={`w-full py-2 px-4 rounded-lg ${
          isProcessing
            ? 'bg-white/20 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/20'
        } transition-colors duration-200`}
      >
        {isProcessing ? 'Processing Transaction...' : 'Execute Transaction'}
      </button>
    </div>
  );
};

const MessageContent: React.FC<MessageContentProps> = ({ message, onTransactionSuccess }) => {
  const [txHash, setTxHash] = React.useState<string | null>(null);

  if (message.transaction?.data?.transactions) {
    return (
      <div className="space-y-4">
        <p className="text-white/80">{message.content}</p>
        {txHash ? (
          <TransactionSuccess
            type={message.transaction.type}
            hash={txHash}
            onNewTransaction={() => {
              // This keeps the success message visible but allows new transactions
              setTxHash(null);
            }}
          />
        ) : (
          <TransactionHandler
            transactions={message.transaction.data.transactions}
            description={`Ready to execute ${message.transaction.type} transaction`}
            onSuccess={(hash) => {
              setTxHash(hash);
              onTransactionSuccess(hash);
            }}
            onError={(error) => {
              console.error('Transaction failed:', error);
            }}
          />
        )}
      </div>
    );
  }
  return <p className="text-white/80">{message.content}</p>;
};

export default function TransactionPage() {
  const router = useRouter();
  const params = useParams();
  const txId = params.id as string;
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { address } = useAccount();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isInputClicked, setIsInputClicked] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  React.useEffect(() => {
    // Initial welcome message
    setMessages([{
      id: uuidv4(),
      role: 'agent',
      content: 'Hello! I can help you with the following actions:\n\n' +
              '• Swap tokens\n' +
              '• Transfer tokens\n' +
              '• Deposit to protocols\n' +
              '• Withdraw from protocols\n' +
              '• Bridge tokens\n\n' +
              'What would you like to do?',
      timestamp: new Date().toLocaleTimeString(),
      user: 'Agent'
    }]);
  }, []);
  
  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/chat/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  const handleTransactionSuccess = (hash: string) => {
    const successMessage: Message = {
      id: uuidv4(),
      role: 'agent',
      content: 'Great! Would you like to perform another transaction? You can try swapping, transferring, depositing, or bridging tokens.',
      timestamp: new Date().toLocaleTimeString(),
      user: 'Agent'
    };
    setMessages(prev => [...prev, successMessage]);
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!address) {
      // Add a message to connect wallet if not connected
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'agent',
        content: 'Please connect your wallet first to proceed with the transaction.',
        timestamp: new Date().toLocaleTimeString(),
        user: 'Agent'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
  
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      user: 'User'
    };
  
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputValue,
          address: address, // Always include the wallet address
          chainId: '4012',
          messages: messages.concat(userMessage).map(msg => ({
            sender: msg.role === 'user' ? 'user' : 'brian',
            content: msg.content,
          })),
        }),
      });
  
      const data = await response.json();
      
      let agentMessage: Message;
      
      // Check if it's an error message that's actually a prompt for more information
      if (data.error && typeof data.error === 'string' && !data.error.includes("not recognized")) {
        // This is a conversational prompt from Brian, not an error
        agentMessage = {
          id: uuidv4(),
          role: 'agent',
          content: data.error,  // This contains Brian's question for more details
          timestamp: new Date().toLocaleTimeString(),
          user: 'Agent'
        };
      } else if (response.ok && data.result?.[0]?.data) {
        // We have transaction data
        const { description, transaction } = data.result[0].data;
        agentMessage = {
          id: uuidv4(),
          role: 'agent',
          content: description,
          timestamp: new Date().toLocaleTimeString(),
          user: 'Agent',
          transaction: transaction
        };
      } else {
        // This is an actual error
        agentMessage = {
          id: uuidv4(),
          role: 'agent',
          content: "I'm sorry, I couldn't understand that. Could you try rephrasing your request? For example, you can say 'swap', 'transfer', 'deposit', or 'bridge'.",
          timestamp: new Date().toLocaleTimeString(),
          user: 'Agent'
        };
      }

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'agent',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
        user: 'Agent'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-mono relative overflow-hidden">
      {/* Dotted background */}
      <div
        className="absolute inset-0 bg-repeat opacity-30"
        style={{ backgroundImage: 'url(/images/dots-pattern.png)' }}
      ></div>

      {/* Main content */}
      <div className="flex flex-col h-full w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Link href="/" className="flex items-center">
              <Home className="w-6 h-6 text-white" />
              <span className="ml-2">Home</span>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <Plus className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-96">
                <DialogHeader>
                  <DialogTitle>Create new</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={createNewChat}
                  >
                    Chat
                  </Button>
                  <Button
                    className="w-full"
                    onClick={createNewTxn}
                  >
                    Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            {address ? (
              <DisconnectButton />
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <MessageContent message={message} onTransactionSuccess={handleTransactionSuccess} />
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            onFocus={() => setIsInputClicked(true)}
            onBlur={() => setIsInputClicked(false)}
          />
          <Button
            variant="ghost"
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
