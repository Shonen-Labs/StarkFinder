"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import Header from "@/components/playground/Header"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockReplyContent = `I can help generate a Cairo contract for "${userMessage.content}". What specific functionalities or features should it include?`
    const aiMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: mockReplyContent }

    setMessages((prevMessages) => [...prevMessages, aiMessage])
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col relative min-h-screen  w-full overflow-x-hidden overflow-y-hidden">
      <Header
        showClearButton={false}
        showFinishButton={false}
        handleClear={() => {}}
        nodes={[]}
        edges={[]}
        flowSummary=""
        selectedNode={null}
        handleDelete={() => {}}
      />
      <main className="flex-1 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-screen overflow-hidden flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-950 text-gray-50 border-gray-800 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-center">Cairo Contract Generator Chatbot</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-10">
                    Type a description of the Cairo contract you want to generate!
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex items-start gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 border border-gray-700">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-50",
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 border border-gray-700">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 border border-gray-700">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] rounded-lg p-3 bg-gray-800 text-gray-50">
                      <p className="text-sm animate-pulse">Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t border-gray-800 p-4">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                placeholder="Describe your Cairo contract..."
                value={input}
                onChange={handleInputChange}
                className="flex-1 bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus-visible:ring-blue-500"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
