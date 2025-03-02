/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";

import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Send, Home, Mic, Ban } from "lucide-react";
import { useAccount } from "@starknet-react/core";
import { ConnectButton, DisconnectButton } from "@/lib/Connect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useRef } from "react";
import Link from "next/link";
// import { PrismaClient } from "@prisma/client";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

// const prisma = new PrismaClient();

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");

  interface Message {
    role: string;
    id: string;
    content: string;
    timestamp: string;
    user: string;
  }
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const { address } = useAccount();

  React.useEffect(() => {
    if (chatId) {
      console.log("Chat ID:", chatId);
      fetchChatHistory(chatId);
    } else {
      createNewChat();
    }
  }, [chatId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamedResponse]);

  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  const fetchChatHistory = async (id: string) => {
    console.log("Fetching chat history for ID:", id);
    setMessages([
      {
        id: uuidv4(),
        role: "agent",
        content: `GM Brother, how can I help you today?`,
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
  
    const newMessage = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      user: "User",
    };
  
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setStreamedResponse("");
    setError("");
  
    try {
      // Format messages for the API - only include unique user messages
      const formattedMessages = Array.from(
        new Set(
          messages
            .filter(msg => msg.role === "user")
            .map(msg => msg.content)
        )
      ).map(content => ({
        sender: "user",
        content
      }));
  
      // Add the current message if it's not already included
      if (!formattedMessages.some(msg => msg.content === inputValue)) {
        formattedMessages.push({
          sender: "user",
          content: inputValue
        });
      }
  
      const requestBody = {
        prompt: inputValue,
        address: address || "0x0",
        messages: formattedMessages,
        stream: true
      };
  
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.message || 'Failed to get response');
      }

      const contentType = response.headers.get("Content-Type") || "";

      if(!response.body || contentType.includes('application/json')){
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
  
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: uuidv4(),
            role: "agent",
            content: data.answer,
            timestamp: new Date().toLocaleTimeString(),
            user: "Agent",
          },
        ]);

        setAnswer(data.answer);
        
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';
  
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
  
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(Boolean);
  
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  if (data.content) {
                    accumulatedResponse += data.content;
                    setStreamedResponse(accumulatedResponse);
                  } else if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error('Error parsing JSON:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
  
        // Add final message to chat
        if (accumulatedResponse) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: "agent",
            content: accumulatedResponse,
            timestamp: new Date().toLocaleTimeString(),
            user: "Agent",
          }]);
          setAnswer(accumulatedResponse);
        }

      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || "Unable to get response");
      setAnswer("");
    } finally {
      setIsLoading(false);
      setStreamedResponse("");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-mono relative overflow-hidden">
      {/* Dotted background */}
      <div
        className="absolute inset-0 bg-repeat opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Content wrapper */}
      <div className="flex w-full h-full relative z-10">
        {/* Sidebar */}
        <div className="w-48 border-r border-white/20 p-4 flex flex-col gap-2 bg-black/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            className="justify-start border border-white/20 hover:bg-white/10 transition-colors"
          >
            Agent Chats
          </Button>
          <Button
            variant="ghost"
            className="justify-start border border-white/20 hover:bg-white/10 transition-colors"
          >
            Agent Txns
          </Button>
          <Separator className="my-2 bg-white/20" />
          <Dialog>
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
          </Dialog>

          <div className="mt-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-500">Online</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black/30 backdrop-blur-sm">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/50">
              <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
              </Link>
            <div className="flex items-center gap-4">
              {address ? (
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-muted rounded-md bg-slate-900">
                    {" "}
                    {address.slice(0, 5) + "..." + address.slice(-3)}
                  </div>
                  <DisconnectButton />
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4">
            {messages.map((message, index) => (
              <div key={index} className="mb-4">
                <div className="font-bold">
                  {message.role === "user" ? "You" : "Assistant"}:
                </div>
                <div className="bg-white/5 p-2 rounded-lg mt-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
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
              <div className="mb-4">
                <div className="font-bold">Assistant:</div>
                <div className="bg-white/5 p-2 rounded-lg mt-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamedResponse}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/20 bg-black/50">
            <div className="relative">
              <Input
                placeholder="Type Something..."
                className="bg-white/5 border border-white/20 text-white pl-4 pr-24 py-6 rounded-full focus:ring-2 focus:ring-white/50 transition-all"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 transition-colors rounded-full"
                onClick={handleSendMessage}
              >
                {isLoading ? <Ban className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send message</span>
              </Button>
              {/* <Button
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 -translate-y-1/2 hover:bg-white/10 transition-colors rounded-full"
                disabled={isLoading}
              >
                <Mic className="h-5 w-5" />
                <span className="sr-only">Voice input</span>
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}