/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  chats: Chat[]
  currentChat: Chat | null
  isLoading: boolean
  createNewChat: () => void
  selectChat: (chatId: string) => void
  sendMessage: (content: string) => Promise<void>
  deleteChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('starkfinder-chats')
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setChats(parsedChats)
        
        // Set the most recent chat as current
        if (parsedChats.length > 0) {
          setCurrentChat(parsedChats[0])
        }
      } catch (error) {
        console.error('Error loading chats from localStorage:', error)
      }
    }
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    localStorage.setItem('starkfinder-chats', JSON.stringify(chats))
  }, [chats])

  const createNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setChats(prev => [newChat, ...prev])
    setCurrentChat(newChat)
  }

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setCurrentChat(chat)
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentChat) {
      createNewChat()
      // Wait for the new chat to be created
      setTimeout(() => sendMessage(content), 100)
      return
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    // Add user message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      updatedAt: new Date()
    }

    // Update title if it's the first message
    if (currentChat.messages.length === 0) {
      updatedChat.title = content.length > 50 ? content.substring(0, 50) + '...' : content
    }

    setCurrentChat(updatedChat)
    setChats(prev => prev.map(c => c.id === currentChat.id ? updatedChat : c))

    setIsLoading(true)

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I can help you generate a Cairo contract for "${content}". What specific functionalities or features should it include?`,
        timestamp: new Date()
      }

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date()
      }

      setCurrentChat(finalChat)
      setChats(prev => prev.map(c => c.id === currentChat.id ? finalChat : c))
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId))
    
    if (currentChat?.id === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId)
      setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null)
    }
  }

  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, title, updatedAt: new Date() } : c
    ))
    
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, title, updatedAt: new Date() } : null)
    }
  }

  const value: ChatContextType = {
    chats,
    currentChat,
    isLoading,
    createNewChat,
    selectChat,
    sendMessage,
    deleteChat,
    updateChatTitle
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
