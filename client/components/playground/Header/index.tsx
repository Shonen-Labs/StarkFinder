/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Compile from "../Modal/Compile";
import { useAccount, useConnect } from "@starknet-react/core";
import { DisconnectButton } from "@/lib/Connect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Home, Upload, MessageSquare, Book, Wallet, Bot } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const MODELS = [
  { id: "deepseek", name: "DeepSeek", icon: "🔍" },
  { id: "claude", name: "Claude", icon: "🤖" },
  { id: "openai", name: "OpenAI", icon: "⚡" },
  { id: "llama", name: "Llama 3", icon: "🦙" },
  { id: "mistral", name: "Mistral", icon: "🌪️" },
];

interface HeaderProps {
  showClearButton: boolean;
  showFinishButton: boolean;
  handleClear: () => void;
  nodes: any;
  edges: any;
  flowSummary: any;
  selectedNode: any;
  handleDelete: (node: any) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export default function Header({
  showClearButton,
  showFinishButton,
  handleClear,
  nodes,
  edges,
  flowSummary,
  selectedNode,
  handleDelete,
  selectedModel = "deepseek",
  onModelChange,
}: HeaderProps) {
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const isConnected = !!address;

  const router = useRouter();

  function formatAddress(address?: string) {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }

  const handleConnect = async (connectorId: string) => {
    try {
      await connect({
        connector: connectors.find((c) => c.id === connectorId),
      });
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const isDeleteVisible = !!selectedNode;

  const centerItems = (
    <motion.div
      className="flex-1 flex justify-center pb-4 md:pb-0 text-black md:text-white"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
    >
      <ul className="flex flex-col md:flex-row gap-6">
        <li>
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
          >
            <Home size={18} /> Home
          </Link>
        </li>
        <li>
          <Link
            href="/deploy"
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
          >
            <Upload size={18} /> Deploy
          </Link>
        </li>
        <li>
          <button
            onClick={() => router.push(`/agent/c/${uuidv4()}`)}
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
          >
            <MessageSquare size={18} /> Agent
          </button>
        </li>
        <li>
          <Link
            href="/devx/resources"
            className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
          >
            <Book size={18} /> Resources
          </Link>
        </li>
      </ul>
    </motion.div>
  );

  return (
    <>
      <header className="bg-[radial-gradient(circle,_#797474,_#e6e1e1,_#979191)] animate-smoke text-white w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex-1 flex items-center"
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <Link href={"/devx"}>
              <h2 className="text-md md:text-2xl font-semibold text-black cursor-pointer">
                DevXStark
              </h2>
            </Link>
          </motion.div>

          <nav className="hidden md:flex gap-8 text-sm">{centerItems}</nav>

          <motion.div
            className="flex-1 flex items-center justify-start md:justify-end gap-2"
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 1 }}
          >
            <div className="hidden md:flex items-center gap-2">
              <Bot size={18} className="text-black" />
              <Select 
                value={selectedModel}
                onValueChange={onModelChange}
              >
                <SelectTrigger className="w-[150px] bg-white text-black">
                  <div className="flex items-center gap-2">
                    <span>
                      {MODELS.find(m => m.id === selectedModel)?.icon}
                    </span>
                    <SelectValue placeholder="Select Model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.icon}</span>
                        {model.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {formatAddress(address)}
                </span>
                <DisconnectButton className="flex items-center gap-2 text-grayscale-200 border-red-200 hover:bg-red-50 hover:text-green-dark" />
              </div>
            ) : (
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-l bg-primary hover:bg-primary-dark"
              >
                <Wallet size={18} /> Connect Wallet
              </Button>
            )}

            {isDeleteVisible && (
              <Button
                onClick={() => handleDelete(selectedNode)}
                className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
              >
                Delete node
              </Button>
            )}
            {showClearButton && (
              <Button
                onClick={handleClear}
                className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
              >
                Clear
              </Button>
            )}
            {showFinishButton && (
              <Compile
                nodes={nodes}
                edges={edges}
                isOpen={isCompileModalOpen}
                onOpenChange={setIsCompileModalOpen}
                flowSummary={flowSummary}
              />
            )}
          </motion.div>

          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-black hover:text-gray-700"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white p-4 rounded-lg shadow-lg">
            {centerItems}
            <div className="mt-4 flex flex-col gap-2">
              <Select 
                value={selectedModel}
                onValueChange={onModelChange}
              >
                <SelectTrigger className="w-full bg-gray-100">
                  <div className="flex items-center gap-2">
                    <Bot size={16} />
                    <SelectValue placeholder="Select Model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.icon}</span>
                        {model.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </header>

      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <h2 className="text-xl font-bold">Connect your Starknet wallet</h2>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {connectors.map((connector) => {
              const iconSrc = typeof connector.icon === 'object' 
                ? connector.icon.light
                : connector.icon;
              
              return (
                <Button
                  key={connector.id}
                  onClick={() => handleConnect(connector.id)}
                  className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark py-4"
                >
                  {iconSrc && (
                    <Image
                      src={iconSrc}
                      alt={connector.name}
                      width={32}
                      height={32}
                      className="rounded-md"
                    />
                  )}
                  Connect with {connector.name}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}