"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAccount } from "@starknet-react/core"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TransactionMemory } from "./memory"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface TransactionSuggestion {
  type: "SWAP" | "TRANSFER" | "BRIDGE" | "DEPOSIT" | "WITHDRAW"
  metadata: any
}

export default function TransactionPage() {
  const { address } = useAccount()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [transactionSuggestion, setTransactionSuggestion] = useState<TransactionSuggestion | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [memory, setMemory] = useState<TransactionMemory | null>(null)

  useEffect(() => {
    if (address) {
      const chatId = uuidv4() // Generate a new chat ID for this session
      setMemory(new TransactionMemory(address, chatId))
    }
  }, [address])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messagesEndRef]) // Removed unnecessary dependency: messages

  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content: "Hello! I can help you with various transactions. What would you like to do?",
        timestamp: new Date().toISOString(),
      },
    ])
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !address || !memory) return

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await memory.chat(inputValue)

      const agentMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, agentMessage])

      // Analyze the response for transaction suggestions
      const suggestion = analyzeForTransactionSuggestion(response)
      if (suggestion) {
        setTransactionSuggestion(suggestion)
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeForTransactionSuggestion = (response: string): TransactionSuggestion | null => {
    const lowerResponse = response.toLowerCase()
    if (lowerResponse.includes("swap")) {
      return { type: "SWAP", metadata: { suggestion: "AI suggested a token swap" } }
    } else if (lowerResponse.includes("transfer")) {
      return { type: "TRANSFER", metadata: { suggestion: "AI suggested a token transfer" } }
    } else if (lowerResponse.includes("bridge")) {
      return { type: "BRIDGE", metadata: { suggestion: "AI suggested a token bridge" } }
    } else if (lowerResponse.includes("deposit")) {
      return { type: "DEPOSIT", metadata: { suggestion: "AI suggested a deposit" } }
    } else if (lowerResponse.includes("withdraw")) {
      return { type: "WITHDRAW", metadata: { suggestion: "AI suggested a withdrawal" } }
    }
    return null
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>AI-Assisted Transactions</CardTitle>
        <CardDescription>Chat with our AI to manage your transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-4 mb-4">
              <Avatar>
                <AvatarImage src={message.role === "user" ? "/user-avatar.png" : "/ai-avatar.png"} />
                <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium">{message.role === "user" ? "You" : "AI Assistant"}</p>
                <p className="text-sm text-gray-500">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex w-full space-x-2"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !address}>
            Send
          </Button>
        </form>
      </CardFooter>
      {transactionSuggestion && (
        <div className="p-4 bg-gray-100 rounded-b-lg">
          <h3 className="text-lg font-semibold mb-2">Transaction Suggestion</h3>
          <p className="mb-2">The AI suggests a {transactionSuggestion.type.toLowerCase()} transaction.</p>
          <p className="mb-4">Details: {JSON.stringify(transactionSuggestion.metadata)}</p>
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                console.log("Transaction accepted:", transactionSuggestion)
                setTransactionSuggestion(null)
              }}
            >
              Accept
            </Button>
            <Button variant="outline" onClick={() => setTransactionSuggestion(null)}>
              Decline
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

