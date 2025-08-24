"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import ChatMessage from "./ChatMessage"
import ChatInput from "./ChatInput"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatContainerProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  className?: string
}

export default function ChatContainer({ 
  messages, 
  onSendMessage, 
  isLoading = false,
  className 
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  const handleStarkFinderClick = () => {
    router.push('/')
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content: string) => {
    onSendMessage(content)
  }

  return (
    <div className={cn(
      "flex flex-col  min-h-0 bg-gray-950 h-screen",
      className
    )}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#171849] flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 
              className="text-base font-medium text-white cursor-pointer hover:text-blue-400 transition-colors duration-200"
              onClick={handleStarkFinderClick}
            >
              StarkFinder
            </h2>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative min-h-0">
        <ScrollArea 
          className="h-full px-6"
          onScroll={handleScroll}
        >
          <div className="py-6 space-y-1">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-12 h-12 rounded-xl bg-[#171849] flex items-center justify-center mb-6">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Cairo Contract Generator
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Describe your smart contract requirements
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  <button className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                    ERC20 Token
                  </button>
                  <button className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                    Staking Contract
                  </button>
                  <button className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                    DAO Voting
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 px-2 py-3">
                <div className="h-7 w-7 rounded-lg bg-[#171849] flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-800/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 h-10 w-10 p-0 rounded-full shadow-lg bg-[#171849] hover:bg-[#171849]/80 text-white"
            onClick={scrollToBottom}
          >
            ↓
          </Button>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        placeholder="Describe your Cairo contract..."
      />
    </div>
  )
}
