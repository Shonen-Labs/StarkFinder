"use client";

import React, { useState } from "react";
import { Wallet, Rocket } from "lucide-react";
import { ethers } from "ethers";
import { connect as starknetConnect } from "starknet";

export function Navbar() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await ethProvider.getSigner();
        const addr = await signer.getAddress();
        setAccount(addr);
        setProvider(ethProvider);
      } catch (err) {
        console.error("MetaMask connection failed", err);
      }
    } else {
      alert("MetaMask not installed!");
    }
  };

  const connectStarknet = async () => {
    try {
      const starknet = await starknetConnect();
      if (starknet.isConnected) {
        await starknet.enable();
        setAccount(starknet.selectedAddress);
        setProvider(starknet.account);
      }
    } catch (err) {
      console.error("Starknet connection failed", err);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/10 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-400 to-fuchsia-400 grid place-items-center">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white/90">
              StarkFinder
            </span>
          </div>

          {/* Wallet Button */}
          {!account ? (
            <div className="flex gap-2">
              <button
                onClick={connectMetaMask}
                className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-50 px-3 py-1.5 text-sm transition"
              >
                <Wallet className="h-4 w-4" /> MetaMask
              </button>
              <button
                onClick={connectStarknet}
                className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-50 px-3 py-1.5 text-sm transition"
              >
                <Wallet className="h-4 w-4" /> Starknet
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-mono">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <button
                onClick={disconnectWallet}
                className="text-xs text-red-400 hover:text-red-200"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
