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
import { Plus, Send, Home, Mic, Ban, Search } from "lucide-react";
import { useAccount, useProvider } from "@starknet-react/core";
import { ConnectButton, DisconnectButton } from "@/lib/Connect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { TransactionSuccess } from "@/components/TransactionSuccess";
import CommandList from "@/components/ui/command";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LoadingScreen } from "@/components/auth/LoadingScreen";

interface UserPreferences {
  riskTolerance: "low" | "medium" | "high";
  preferredAssets: string[];
  preferredChains: string[];
  investmentHorizon: "short" | "medium" | "long";
}

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
  recommendations?: {
    pools: Array<{
      name: string;
      apy: number;
      tvl: number;
      riskLevel: string;
      impermanentLoss: string;
      chain: string;
      protocol: string;
    }>;
    strategy: string;
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
      onError(new Error("Wallet not connected"));
      return;
    }

    setIsProcessing(true);
    try {
      for (const tx of transactions) {
        const response = await account.execute({
          contractAddress: tx.contractAddress,
          entrypoint: tx.entrypoint,
          calldata: tx.calldata,
        });
        await account.waitForTransaction(response.transaction_hash);
        if (tx === transactions[transactions.length - 1]) {
          onSuccess(response.transaction_hash);
        }
      }
    } catch (error) {
      console.error("Transaction failed:", error);
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
        className={`w-full py-2 px-4 rounded-lg ${isProcessing
          ? "bg-white/20 cursor-not-allowed"
          : "bg-white/10 hover:bg-white/20"
          } transition-colors duration-200`}
      >
        {isProcessing ? "Processing Transaction..." : "Execute Transaction"}
      </button>
    </div>
  );
};

const PreferencesDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (preferences: UserPreferences) => void;
}> = ({ open, onClose, onSubmit }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    riskTolerance: "medium",
    preferredAssets: [],
    preferredChains: [],
    investmentHorizon: "medium",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Investment Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label>Risk Tolerance</label>
            <select
              className="w-full bg-white/5 border border-white/20 rounded-md p-2"
              value={preferences.riskTolerance}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  riskTolerance: e.target
                    .value as UserPreferences["riskTolerance"],
                }))
              }
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          {/* Add similar inputs for other preferences */}
          <Button
            onClick={() => onSubmit(preferences)}
            className="w-full bg-white/10 hover:bg-white/20"
          >
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  onTransactionSuccess,
}) => {
  const [txHash, setTxHash] = React.useState<string | null>(null);

  if (message.recommendations) {
    return (
      <div className="space-y-4">
        <p className="text-white/80">{message.content}</p>
        <div className="grid gap-4">
          <h3 className="font-bold">Recommended Strategy:</h3>
          <p>{message.recommendations.strategy}</p>
          <h3 className="font-bold">Recommended Pools:</h3>
          {message.recommendations.pools.map((pool, index) => (
            <div key={index} className="bg-white/5 p-4 rounded-lg">
              <div className="flex justify-between">
                <span>Pool: {pool.name}</span>
                <span>APY: {pool.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span>TVL: ${pool.tvl.toLocaleString()}</span>
                <span>Risk: {pool.riskLevel}</span>
              </div>
              <div className="text-sm text-white/60">
                IL Risk: {pool.impermanentLoss}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (message.transaction?.data?.transactions) {
    return (
      <div className="space-y-4">
        <p className="text-white/80">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </p>
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
              console.error("Transaction failed:", error);
            }}
          />
        )}
      </div>
    );
  }
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
  );
};

export default function TransactionPage() {
  const router = useRouter();
  const params = useParams();
  const txId = params.id as string;
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const { address } = useAccount();
  const { provider } = useProvider();
  console.log(provider.getChainId());

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isInputClicked, setIsInputClicked] = React.useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(true)
  const [showLoader, setShowloader] = useState(true)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    riskTolerance: "medium",
    preferredAssets: [],
    preferredChains: [],
    investmentHorizon: "medium",
  });
  const [error, setError] = useState("");

  setTimeout(() => {
    setShowloader(false)
  }, 5000);

  React.useEffect(() => {
    console.log("Wallet check effect triggered, address:", address);

    if (address) {
      // If we have an address, user has connected wallet
      console.log("Wallet connected:", address);
      setShowAuthScreen(false);
      
    } else {
      // No wallet connected
      console.log("No wallet connected");
      setShowAuthScreen(true);
    }
  }, [address]);


  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamedResponse]);

  React.useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        id: uuidv4(),
        role: "agent",
        content:
          "Hello! I can help you with the following actions:\n\n" +
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

  // Generates a unique chat ID and navigates to the new chat route.
  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  // Generates a unique chat ID and navigates to the new Transaction route.
  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/c/${id}`);
  };

  const handleTransactionSuccess = (hash: string) => {
    const successMessage: Message = {
      id: uuidv4(),
      role: "agent",
      content:
        "Great! Would you like to perform another transaction? You can try swapping, transferring, depositing, or bridging tokens.",
      timestamp: new Date().toLocaleTimeString(),
      user: "Agent",
    };
    setMessages((prev) => [...prev, successMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!address) {
      // Add a message to connect wallet if not connected
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content:
          "Please connect your wallet first to proceed with the transaction.",
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
    setStreamedResponse("");
    setError("");

    try {
      // Format messages for the API - include unique user messages
      const formattedMessages = Array.from(
        new Set(
          messages
            .filter((msg) => msg.role === "user")
            .map((msg) => msg.content)
        )
      ).map((content) => ({
        sender: "user",
        content,
      }));

      // Add the current message if it's not already included
      if (!formattedMessages.some((msg) => msg.content === inputValue)) {
        formattedMessages.push({
          sender: "user",
          content: inputValue,
        });
      }

      const requestBody = {
        prompt: inputValue,
        address: address,
        messages: messages,
        userPreferences,
        stream: true,
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.message || "Failed to get response");
      }

      const contentType = response.headers.get("Content-Type") || "";

      if (!response.body || contentType.includes("application/json")) {
        // Handle non-streamed response
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.result?.[0]?.data) {
          // We have transaction data
          const { description, transaction } = data.result[0].data;
          const agentMessage: Message = {
            id: uuidv4(),
            role: "agent",
            content: description,
            timestamp: new Date().toLocaleTimeString(),
            user: "Agent",
            transaction: transaction,
          };

          setMessages((prevMessages) => [...prevMessages, agentMessage]);
        } else {
          // Normal response
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: uuidv4(),
              role: "agent",
              content: data.answer || data.content,
              timestamp: new Date().toLocaleTimeString(),
              user: "Agent",
            },
          ]);
        }
      } else {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(5));
                  if (data.content) {
                    accumulatedResponse += data.content;
                    setStreamedResponse(accumulatedResponse);
                  } else if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error("Error parsing JSON:", e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Add final message to chat
        if (accumulatedResponse) {
          // Check if the response contains transaction data
          try {
            const jsonResponse = JSON.parse(accumulatedResponse);
            if (jsonResponse.result?.[0]?.data) {
              const { description, transaction } = jsonResponse.result[0].data;
              setMessages((prev) => [
                ...prev,
                {
                  id: uuidv4(),
                  role: "agent",
                  content: description,
                  timestamp: new Date().toLocaleTimeString(),
                  user: "Agent",
                  transaction: transaction,
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: uuidv4(),
                  role: "agent",
                  content: accumulatedResponse,
                  timestamp: new Date().toLocaleTimeString(),
                  user: "Agent",
                },
              ]);
            }
          } catch {
            // If it's not valid JSON, add it as a regular message
            setMessages((prev) => [
              ...prev,
              {
                id: uuidv4(),
                role: "agent",
                content: accumulatedResponse,
                timestamp: new Date().toLocaleTimeString(),
                user: "Agent",
              },
            ]);
          }
        }
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Unable to get response");

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "agent",
          content:
            err.message || "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamedResponse("");
    }
  };

  if(showLoader){
    return <LoadingScreen />
  }

  if (showAuthScreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="text-center">
          <p className="mb-4">
            {!address
              ? "Please connect your wallet to access chat agent"
              : "You don't have access to this chat"}
          </p>
          <div className="flex flex-col gap-4">
            <ConnectButton text="Connect Wallet" />

            <Button className="w-[60%] self-center" onClick={() => router.push('/')}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider className="w-screen">
      <Sidebar className="border-r border-white/20 bg-[#010101] px-2">
        <SidebarHeader>
          <h2 className="text-2xl text-white mb-4">StarkFinder</h2>
          {/* <Button
            variant="ghost"
            className="border border-white/20 transition-colors bg-[#1E1E1E] mb-2 flex justify-between"
            onClick={createNewChat}
          >
            <span>Agent Chat</span>
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="border border-white/20 transition-colors bg-[#1E1E1E] flex justify-between"
            onClick={createNewTxn}
          >
            <span>Agent Txn</span>
            <Plus className="h-4 w-4" />
          </Button> */}
          <Separator className="my-2 bg-white/20" />
          {/* <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="justify-start gap-2 border border-white/20 hover:bg-white/10 transition-colors"
              >
                <Plus className="h-4 w-4" /> New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Create New</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  variant="outline"
                  className="bg-slate-900 justify-start border border-white/20 hover:bg-white/10 transition-colors"
                  onClick={createNewChat}
                >
                  Chat
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-900 justify-start border border-white/20 hover:bg-white/10 transition-colors"
                  onClick={createNewTxn}
                >
                  Txn
                </Button>
              </div>
            </DialogContent>
          </Dialog> */}
        </SidebarHeader>

        <SidebarContent>
          <div className="flex flex-col gap-4">
            <h4 className="text-sm">Transaction History</h4>
            <Input
              placeholder="Search"
              className="bg-transparent border border-white/20 text-white py-4 text-sm rounded-lg focus:ring-2 focus:ring-white/50 transition-all"
            />
            <div
              className="overflow-y-auto h-64 flex flex-col gap-2 pr-2
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-[#060606]
              [&::-webkit-scrollbar-thumb]:bg-white/10
              [&::-webkit-scrollbar-thumb]:rounded-full
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
            >
              {[0, 1, 2, 4, 5].map((index) => (
                <div
                  key={index}
                  className="flex flex-col p-2 px-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer gap-1"
                >
                  <span>0x86ecca95fec</span>
                  <span className="text-[#eee] text-[0.8em]">
                    12th Dec, 2025
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="mt-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-500">Online</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 h-screen bg-gradient-to-br from-gray-900 to-black text-white font-mono relative overflow-hidden">
        {/* Dotted background  */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1.5px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Content wrapper */}
        <div className="flex w-full h-full relative z-10">
          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-[#060606] backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/20 bg-[#010101]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4 hidden md:block" />
                    Home
                  </Link>
                </div>
                <h4 className="text-xl">StarkFinder - Transactions</h4>
              </div>
              <div className="flex items-center gap-4">
                {address ? (
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-muted rounded-md bg-slate-900">{`${address?.slice(
                      0,
                      5
                    )}...${address?.slice(-3)}`}</div>
                    <DisconnectButton />
                  </div>
                ) : (
                  <ConnectButton />
                )}
              </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-2 mb-4 animate-fadeIn"
                >
                  <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-xs bg-white/5">
                    {message.role === "agent" ? "A" : "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">
                        {message.role === "agent" ? "Transaction Agent" : "You"}
                      </span>
                      <span className="text-xs text-white/60">
                        ({message.timestamp})
                      </span>
                    </div>
                    <div className="text-white/80 bg-white/5 p-2 rounded-lg">
                      <MessageContent
                        message={message}
                        onTransactionSuccess={handleTransactionSuccess}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              )}

              {streamedResponse && (
                <div className="flex gap-2 mb-4 animate-fadeIn">
                  <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-xs bg-white/5">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">Transaction Agent</span>
                      <span className="text-xs text-white/60">
                        ({new Date().toLocaleTimeString()})
                      </span>
                    </div>
                    <div className="text-white/80 bg-white/5 p-2 rounded-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamedResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </ScrollArea>

            {isInputClicked && (
              <CommandList
                setMessages={setMessages}
                inputValue={inputValue}
                userPreferences={userPreferences}
                messages={messages}
                setIsLoading={setIsLoading}
                setInputValue={setInputValue}
                isLoading={isLoading}
              />
            )}
            {/* Input Area */}
            <div className="p-4 border-t border-white/20 bg-[#010101]">
              <div className="relative">
                <Input
                  placeholder="Type your message..."
                  className="bg-white/5 border border-white/20 text-white pl-4 pr-24 py-6 rounded-lg focus:ring-2 focus:ring-white/50 transition-all"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsInputClicked(false);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                  onClick={() => setIsInputClicked(!isInputClicked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 transition-colors rounded-full"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Ban className="h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowPreferences(true)}
          className="absolute right-20 top-4"
        >
          Investment Preferences
        </Button>
        {isInputClicked && (
          <CommandList
            setMessages={setMessages}
            inputValue={inputValue}
            userPreferences={userPreferences}
            messages={messages}
            setIsLoading={setIsLoading}
            setInputValue={setInputValue}
            isLoading={isLoading}
          />
        )}
        {/* Input Area */}
        <div className="p-4 border-t border-white/20 bg-[#010101]">
          <div className="relative">
            <Input
              placeholder="Type your message..."
              className="bg-white/5 border border-white/20 text-white pl-4 pr-24 py-6 rounded-lg focus:ring-2 focus:ring-white/50 transition-all"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsInputClicked(false);
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
              onClick={() => setIsInputClicked(!isInputClicked)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 transition-colors rounded-full"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <Ban className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowPreferences(true)}
        className="absolute right-20 top-4"
      >
        Investment Preferences
      </Button>

      <PreferencesDialog
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSubmit={(prefs) => {
          setUserPreferences(prefs);
          setShowPreferences(false);
        }}
      />
    </SidebarProvider>
  );
}