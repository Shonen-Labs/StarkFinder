"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Compile from "../Modal/Compile";
import { useAccount, useConnect } from "@starknet-react/core";
import { DisconnectButton } from "@/lib/Connect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Home, Book, Wallet, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

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
}: HeaderProps) {
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: session, status } = useSession();
  const isConnected = !!address;

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

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isDeleteVisible = !!selectedNode;

  const centerItems = (
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
          href="/devx/resources"
          className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
        >
          <Book size={18} /> Resources
        </Link>
      </li>
    </ul>
  );

  return (
    <>
      <header className="bg-[radial-gradient(circle,_#797474,_#e6e1e1,_#979191)] animate-smoke text-white w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href={"/devx"}>
              <h2 className="text-md md:text-2xl font-semibold text-black cursor-pointer">
                DevXStark
              </h2>
            </Link>
          </div>

          <nav className="hidden md:flex gap-8 text-sm">{centerItems}</nav>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-[180px] bg-green-100 text-green-800 rounded-full text-sm px-3 py-1 hover:bg-green-200">
                  <div className="flex items-center gap-2">
                    <span>{formatAddress(address)}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md rounded-md flex justify-center">
                  <SelectItem value="disconnect" className="focus:bg-red-50">
                    <div className="flex items-center gap-2 text-red-600">
                      <DisconnectButton className="text-red-600 hover:text-red-800" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Button
              onClick={() => setIsWalletModalOpen(true)}
              className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-l bg-primary hover:bg-primary-dark"
            >
              <Wallet size={18} /> Connect Wallet
            </Button>
          )}

          {/* User Session Info & Logout */}
          {status === "loading" ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
            </div>
          ) : session ? (
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-sm transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Sign Out</span>
              </motion.button>
            </div>
          ) : null}

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
              {/* Mobile User Session & Logout */}
              {status === "loading" ? (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                </div>
              ) : session ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  <Button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </div>
              ) : null}
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
              const iconSrc =
                typeof connector.icon === "object"
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
                      src={iconSrc || "/placeholder.svg"}
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