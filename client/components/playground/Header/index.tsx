/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Compile from "../Modal/Compile";
import { connect, disconnect } from "starknetkit";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import Argent from "@/public/img/Argent Wallet.png";
import Bravoos from "@/public/img/bravoos wallet.jpeg";

interface HeaderProps {
  showClearButton: boolean;
  showFinishButton: boolean;
  handleClear: () => void;
  nodes: any;
  edges: any;
  flowSummary: any;
  selectedNode: any;
  handleDelete: (node: any) => void;
}

interface StarknetConnection {
  wallet?: any;
  provider?: any;
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
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState("DevXStark");
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Wallet connection state
  const [connection, setConnection] = useState<StarknetConnection | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const isConnected = !!connection?.wallet;

  // Helper to extract the wallet address
  const getWalletAddress = async (wallet: any): Promise<string | undefined> => {
    try {
      if (wallet.getAccount) {
        return await wallet.getAccount();
      }
      if (wallet.selectedAddress) {
        return wallet.selectedAddress;
      }
      if (wallet.account) {
        return wallet.account;
      }
      if (wallet.enable) {
        const accounts = await wallet.enable();
        return accounts?.[0];
      }
      if (wallet.signer?.getAddress) {
        return await wallet.signer.getAddress();
      }
      console.error("Could not determine wallet address format");
      return undefined;
    } catch (error) {
      console.error("Error getting wallet address:", error);
      return undefined;
    }
  };

  // On mount, check for existing wallet connection
  useEffect(() => {
    const checkConnection = async () => {
      const savedConnection = localStorage.getItem("starknetConnection");
      if (savedConnection) {
        try {
          const result = await connect({ modalMode: "neverAsk" });
          if (result?.wallet) {
            setConnection(result);
            const address = await getWalletAddress(result.wallet);
            setWalletAddress(address);
          }
        } catch (error) {
          console.error("Failed to reconnect wallet:", error);
          localStorage.removeItem("starknetConnection");
        }
      }
    };
    checkConnection();
  }, []);

  // Connect wallet function
  const handleConnectWallet = async () => {
    try {
      const result = await connect({
        webWalletUrl: "https://web.argent.xyz",
        dappName: "DevXStark",
      });
      if (result?.wallet) {
        setConnection(result);
        const address = await getWalletAddress(result.wallet);
        setWalletAddress(address);
        localStorage.setItem("starknetConnection", "true");
        setIsWalletModalOpen(false);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Disconnect wallet function
  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      setConnection(null);
      setWalletAddress(undefined);
      localStorage.removeItem("starknetConnection");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  // Format wallet address for display
  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const isDeleteVisible = !!selectedNode;

  return (
    <>
      <div className="flex items-center m-4">
        {/* Left: Editable Project Title */}
        <div className="flex-1 flex items-center gap-4 ml-8">
          {isEditing ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              className="text-2xl text-black font-semibold bg-transparent outline-none border-b border-white"
              autoFocus
            />
          ) : (
            <h2
              className="text-2xl font-semibold text-black cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {projectName || "Project Name"}
            </h2>
          )}
        </div>

        {/* Center: Navigation Links */}
        <div className="flex-1 flex justify-center">
          <ul className="flex gap-6">
            <li>
              <Link href="/" className="hover:text-blue-500 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/deploy" className="hover:text-blue-500 transition-colors">
                Deploy
              </Link>
            </li>
            <li>
              <Link href="/agent/chat/someId" className="hover:text-blue-500 transition-colors">
                Agent
              </Link>
            </li>
            <li>
              <Link href="/devx/resources" className="hover:text-blue-500 transition-colors">
                Resources
              </Link>
            </li>
          </ul>
        </div>

        {/* Right: Wallet Connection & Action Buttons */}
        <div className="flex-1 flex items-center justify-end gap-2 mr-8">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {formatAddress(walletAddress)}
              </span>
              <Button
                variant="outline"
                onClick={handleDisconnectWallet}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button variant="primary" onClick={() => setIsWalletModalOpen(true)}>
              Connect wallet
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
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <h2>Connect your Starknet wallet</h2>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={handleConnectWallet}
              className="flex items-center justify-center gap-2"
            >
              <img src={Argent.src} alt="Argent" className="w-10 h-10" />
              Connect with Argent
            </Button>
            <Button
              onClick={handleConnectWallet}
              className="flex items-center justify-center gap-2"
            >
              <img src={Bravoos.src} alt="Braavos" className="w-9 h-9 rounded-md" />
              Connect with Braavos
            </Button>
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              Other Starknet Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
