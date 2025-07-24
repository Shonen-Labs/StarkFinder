"use client";

import React, { useState } from "react";
import { Home, Book, Wallet, LogOut, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useAccount, useConnect } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

interface DevXNavbarProps {
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
}

export function DevXNavbar({ isWalletModalOpen, setIsWalletModalOpen }: DevXNavbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const { address } = useAccount();
  const { connect, connectors } = useConnect();

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

  return (
    <>
      <header className="bg-[radial-gradient(circle,_#797474,_#e6e1e1,_#979191)] animate-smoke text-white w-full shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center h-16">
          <div className="flex items-center">
            <Link href="/devx">
              <h2 className="text-md md:text-2xl font-semibold text-black cursor-pointer">
                DevXStark
              </h2>
            </Link>
          </div>
          
          <div className="flex-1" />
          
          <div className="hidden md:flex items-center gap-4 justify-end">
            <Link
              href="/"
              className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
            >
              <Home size={18} /> Home
            </Link>
            <Link
              href="/devx/resources"
              className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
            >
              <Book size={18} /> Resources
            </Link>
            {!address && (
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-primary hover:bg-primary-dark h-8"
              >
                <Wallet size={16} /> Connect Wallet
              </Button>
            )}
            {session && (
              <Button
                onClick={handleLogout}
                className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-red-600 hover:bg-red-700 h-8"
              >
                <LogOut size={16} /> Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-black hover:text-gray-700"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {sidebarOpen && (
          <div className="md:hidden bg-white p-4 rounded-lg shadow-lg mx-4 mb-4">
            <ul className="flex flex-col text-black gap-4">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <Home size={18} /> Home
                </Link>
              </li>
              <li>
                <Link
                  href="/devx/resources"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <Book size={18} /> Resources
                </Link>
              </li>
              {!address && (
                <li>
                  <Button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-primary hover:bg-primary-dark h-8"
                  >
                    <Wallet size={16} /> Connect Wallet
                  </Button>
                </li>
              )}
              {session && (
                <li>
                  <Button
                    onClick={handleLogout}
                    className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-red-600 hover:bg-red-700 h-8"
                  >
                    <LogOut size={16} /> Logout
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>

      {/* Wallet Connection Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Connect {connector.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 