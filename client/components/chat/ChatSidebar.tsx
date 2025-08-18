"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Home, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings,
  Bot,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Chat as ChatType } from "@/lib/chat-context"

interface ChatSidebarProps {
  chats: ChatType[]
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  className?: string
}

export default function ChatSidebar({ 
  chats, 
  onNewChat, 
  onDeleteChat, 
  className 
}: ChatSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleNewChat = () => {
    onNewChat()
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
  }

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    onDeleteChat(chatId)
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-900 border-r border-gray-800 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white">StarkFinder</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
          >
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 h-10 rounded-lg",
            pathname === "/chat" && "bg-[#171849] text-white hover:bg-[#171849]/80"
          )}
          onClick={() => router.push("/chat")}
        >
          <Home className="h-4 w-4 mr-3" />
          {!isCollapsed && "Home"}
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 h-10 rounded-lg"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4 mr-3" />
          {!isCollapsed && "New Chat"}
        </Button>
      </div>

      <Separator className="bg-gray-800" />

      {/* Recent Chats */}
      <div className="flex-1 px-4 py-3">
        {!isCollapsed && (
          <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Recent Chats</h3>
        )}
        
        <ScrollArea className="h-full">
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <div
                key={chat.id}
                                                  className={cn(
                   "group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors",
                   pathname === `/chat/${chat.id}` 
                     ? "bg-[#171849] text-white" 
                     : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                 )}
                 onClick={() => handleChatClick(chat.id)}
               >
                 <div className="flex items-center min-w-0 flex-1">
                   <MessageSquare className="h-3.5 w-3.5 mr-2.5 flex-shrink-0" />
                   {!isCollapsed && (
                     <div className="min-w-0 flex-1">
                       <p className="text-sm font-medium truncate">{chat.title}</p>
                       {chat.messages.length > 0 && (
                         <p className="text-xs text-gray-400 truncate mt-0.5">
                           {chat.messages[chat.messages.length - 1].content.substring(0, 40)}
                           {chat.messages[chat.messages.length - 1].content.length > 40 ? '...' : ''}
                         </p>
                       )}
                     </div>
                   )}
                 </div>
                 
                 {!isCollapsed && (
                   <Button
                     variant="ghost"
                     size="sm"
                     className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 h-6 w-6 p-0 rounded-md"
                     onClick={(e) => handleDeleteChat(e, chat.id)}
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 )}
               </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50 h-10 rounded-lg"
        >
          <Settings className="h-4 w-4 mr-3" />
          {!isCollapsed && "Settings"}
        </Button>
      </div>
    </div>
  )
}
