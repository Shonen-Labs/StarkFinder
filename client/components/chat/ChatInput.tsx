"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Mic, StopCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export default function ChatInput({ 
  onSend, 
  isLoading = false, 
  placeholder = "Type your message...",
  className 
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    onSend(input.trim())
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
  }

  const handleFileUpload = () => {
    // TODO: Implement file upload functionality
    console.log("File upload clicked")
  }

  const handleVoiceRecord = () => {
    // TODO: Implement voice recording functionality
    setIsRecording(!isRecording)
    console.log("Voice recording:", !isRecording)
  }

  // Auto-resize input (not needed for Input component)
  useEffect(() => {
    // Input component doesn't need height adjustment
  }, [input])

  return (
    <div className={cn(
      "border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm px-6 py-4",
      className
    )}>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* File Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
          onClick={handleFileUpload}
          disabled={isLoading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Voice Record Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 w-9 p-0 rounded-lg",
            isRecording 
              ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
          )}
          onClick={handleVoiceRecord}
          disabled={isLoading}
        >
          {isRecording ? (
            <StopCircle className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[40px] bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-400 focus-visible:ring-[#171849] focus-visible:ring-2 rounded-xl pr-12"
            disabled={isLoading}
          />
          
          {/* Character Count */}
          {input.length > 0 && (
            <div className="absolute bottom-2 right-3 text-xs text-gray-500">
              {input.length}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-9 px-4 bg-[#171849] hover:bg-[#171849]/80 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          Recording
        </div>
      )}
    </div>
  )
}
