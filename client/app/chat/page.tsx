"use client"

import { useChat } from "@/lib/chat-context"
import ChatSidebar from "@/components/chat/ChatSidebar"
import ChatContainer from "@/components/chat/ChatContainer"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { 
    chats, 
    currentChat, 
    isLoading, 
    createNewChat, 
    sendMessage, 
    deleteChat 
  } = useChat()

  // Create a new chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat()
    }
  }, [chats.length, createNewChat])

  const handleNewChat = () => {
    createNewChat()
  }

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId)
  }

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  return (
    <div className="flex h-screen min-h-screen bg-gray-950">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50">
            <ChatSidebar
              chats={chats}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          chats={chats}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-900/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">Chat</h1>
          <div className="w-9" />
        </div>

        <div className="flex-1 min-h-0">
          {currentChat ? (
            <ChatContainer
              messages={currentChat.messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-[#171849] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Loading chat...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
