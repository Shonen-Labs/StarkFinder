"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check, Bot, User, MoreVertical } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

interface ChatMessageProps {
  message: Message
  className?: string
}

export default function ChatMessage({ message, className }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const isUser = message.role === "user"

    return (
    <div className={cn(
      "group relative flex items-start gap-3 px-2 py-2 hover:bg-gray-900/30 transition-colors rounded-lg",
      isUser ? "justify-end" : "justify-start",
      className
    )}>
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-7 w-7 border-0 flex-shrink-0">
          <AvatarImage src="/placeholder.svg?height=28&width=28" alt="AI" />
          <AvatarFallback className="bg-[#171849] text-white text-xs">
            <Bot className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn(
        "relative max-w-[85%] min-w-[180px]",
        isUser ? "order-2" : "order-1"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-[#171849] text-white" 
            : "bg-gray-800/60 text-gray-100"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Message Actions */}
        <div className={cn(
          "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "-left-2" : "-right-2"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg backdrop-blur-sm"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <div className={cn(
            "text-xs text-gray-500 mt-2 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-7 w-7 border-0 flex-shrink-0 order-1">
          <AvatarImage src="/placeholder.svg?height=28&width=28" alt="You" />
          <AvatarFallback className="bg-gray-600 text-white text-xs">
            <User className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
