/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SessionAccountInterface } from '@argent/tma-wallet';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initWebApp } from './WebApp';
import { getArgentTMA } from '@/lib/wallet/argentwallet';
import { Message, MessageContentProps } from './types';

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  onTransactionSuccess,
}) => {
  const [txHash, setTxHash] = React.useState<string | null>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);

  const executeTransaction = async () => {
    const argentTMA = getArgentTMA();
    if (!argentTMA || !message.transaction?.data?.transactions) return;

    setIsExecuting(true);
    try {
      const connection = await argentTMA.connect();
      if (!connection || connection.account.getSessionStatus() !== "VALID") {
        throw new Error("Invalid session");
      }

      for (const tx of message.transaction.data.transactions) {
        const response = await connection.account.execute({
          contractAddress: tx.contractAddress,
          entrypoint: tx.entrypoint,
          calldata: tx.calldata,
        });
        await connection.account.waitForTransaction(response.transaction_hash);
        setTxHash(response.transaction_hash);
        onTransactionSuccess(response.transaction_hash);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (message.transaction?.data?.transactions) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--tg-theme-text-color)]">{message.content}</p>
        {txHash ? (
          <div className="p-2 bg-green-500/10 rounded">
            <p>Transaction successful! ✨</p>
            <a
              href={`https://sepolia.voyager.online/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View on Explorer
            </a>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm mb-4">
              Ready to execute {message.transaction.type} transaction
            </p>
            <button
              onClick={executeTransaction}
              disabled={isExecuting}
              className="w-full py-2 px-4 rounded-lg bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
            >
              {isExecuting ? "Executing..." : "Execute Transaction"}
            </button>
          </div>
        )}
      </div>
    );
  }
  return <p className="text-[var(--tg-theme-text-color)]">{message.content}</p>;
};




interface ButtonAction {
  label: string;
  type: 'wallet' | 'transaction' | 'balance' | 'general';
  action: () => void;
}

function TelegramMiniApp(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<SessionAccountInterface | null>(null);
  const [availableActions, setAvailableActions] = useState<ButtonAction[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleConnect = async () => {
    try {
      const argentTMA = getArgentTMA();

      if (!argentTMA) {
        const errorMessage: Message = {
          id: uuidv4(),
          role: "agent",
          content: "Failed to initialize wallet. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      await argentTMA.requestConnection({ callbackData: 'test' });
      const connection = await argentTMA.connect();

      if (connection && connection.account.getSessionStatus() === "VALID") {
        setAccount(connection.account);
        const successMessage: Message = {
          id: uuidv4(),
          role: "agent",
          content: "Wallet connected successfully! You can now proceed with transactions.",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error("Invalid session after connection");
      }
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Failed to connect wallet. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // New method for generating context-sensitive buttons
  const generateContextButtons = () => {
    const buttons: ButtonAction[] = [
      {
        label: account ? "Connected Wallet" : "Connect Wallet",
        type: 'wallet',
        action: handleConnect
      },
      {
        label: "Check Balance",
        type: 'balance',
        action: handleCheckBalance
      }
    ];

    if (account) {
      buttons.push({
        label: "New Transaction",
        type: 'transaction',
        action: () => setInputValue("/txn")
      });
    }

    setAvailableActions(buttons);
  };

  // New method to handle balance check
  const handleCheckBalance = async () => {
    if (!account) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Please connect your wallet first.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    try {
      const response = await fetch("/api/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: account.address,
          chainId: "4012"
        }),
      });

      const data = await response.json();
      const balanceMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: `Your wallet balance:\n${JSON.stringify(data.balances, null, 2)}`,
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages(prev => [...prev, balanceMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Failed to retrieve balance. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Render buttons in UI
  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-2 mb-4 p-2">
      {availableActions.map((action) => (
        <button
          key={action.label}
          onClick={action.action}
          className="px-3 py-2 rounded bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      ))}
    </div>
  );

  // Existing useEffect hooks
  useEffect(() => {
    if (typeof window !== "undefined") {
      initWebApp();
      const argentTMA = getArgentTMA();

      if (argentTMA) {
        argentTMA.connect()
          .then((res) => {
            if (res && res.account.getSessionStatus() === "VALID") {
              setAccount(res.account);
            }
          })
          .catch(console.error);
      }
    }

    setMessages([
      {
        id: uuidv4(),
        role: "agent",
        content:
          "Hello! I can help you with:\n\n" +
          "• Swap tokens\n" +
          "• Transfer tokens\n" +
          "• Deposit to protocols\n" +
          "• Withdraw from protocols\n" +
          "• Bridge tokens\n\n" +
          "What would you like to do?",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      },
    ]);
  }, []);

  // Update buttons when account changes
  useEffect(() => {
    generateContextButtons();
  }, [account]);
  const handleTransactionSuccess = (hash: string) => {
    const successMessage: Message = {
      id: uuidv4(),
      role: "agent",
      content: `Transaction successful! Hash: ${hash}. Would you like to do another transaction?`,
      timestamp: new Date().toLocaleTimeString(),
      user: "Agent",
    };
    setMessages((prev) => [...prev, successMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!account) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Please connect your Argent wallet first to proceed.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      user: "User",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputValue,
          address: account.address,
          chainId: "4012",
          messages: messages.concat(userMessage).map((msg) => ({
            sender: msg.role === "user" ? "user" : "brian",
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();
      let agentMessage: Message;

      if (
        data.error &&
        typeof data.error === "string" &&
        !data.error.includes("not recognized")
      ) {
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content: data.error,
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
      } else if (response.ok && data.result?.[0]?.data) {
        const { description, transaction } = data.result[0].data;
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content: description,
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
          transaction: transaction,
        };
      } else {
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content:
            "I'm sorry, I couldn't understand that. Could you try rephrasing your request?",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
      }

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  // Rest of the existing component methods remain the same
  // (handleConnect, handleSendMessage, etc.)

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-none p-4 border-b border-white/20">
        {renderActionButtons()}
      </div>

      {/* Rest of the existing return statement */}
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className="font-bold text-[var(--tg-theme-text-color)]">
              {message.role === "user" ? "You" : "Assistant"}:
            </div>
            <div className="bg-white/5 p-2 rounded-lg mt-1">
              <MessageContent
                message={message}
                onTransactionSuccess={handleTransactionSuccess}
              />
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </ScrollArea>

      <div className="flex-none p-4 border-t border-white/20">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-white/5"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TelegramMiniApp;