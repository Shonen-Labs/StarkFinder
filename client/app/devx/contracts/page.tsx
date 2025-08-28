"use client";

import { motion } from "framer-motion";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Sidebar from "@/components/devx/contracts/Sidebar";
import { DevXFooter } from "@/components/footer/footer";
import { useState } from "react";
import { ethers } from "ethers";
import { connect as starknetConnect } from "starknet";

const contracts = [
  {
    category: "Wallets",
    description: "Connect your Starknet wallet and interact with contracts",
    items: [
      {
        title: "Connect MetaMask",
        url: "#",
        description: "Ethereum-compatible wallet",
        icon: "🦊",
        type: "metamask",
      },
      {
        title: "Connect Starknet (ArgentX/Braavos)",
        url: "#",
        description: "Native Starknet wallets",
        icon: "🦄",
        type: "starknet",
      },
    ],
  },
  // Keep the other docs sections as they are…
];

interface ContractItem {
  title: string;
  url: string;
  description: string;
  icon: string;
  type?: string;
}

export default function ContractsPage() {
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

  const signTransaction = async () => {
    if (!provider) return alert("No wallet connected!");
    try {
      if (provider.getSigner) {
        const signer = await provider.getSigner();
        const sig = await signer.signMessage("Hello Starknet 🚀");
        alert(`Signed: ${sig}`);
      } else {
        const sig = await provider.signMessage({ message: "Hello Starknet 🚀" });
        alert(`Signed: ${JSON.stringify(sig)}`);
      }
    } catch (err) {
      console.error("Signing failed", err);
    }
  };

  const handleConnect = (type: string | undefined) => {
    if (type === "metamask") connectMetaMask();
    if (type === "starknet") connectStarknet();
  };

  const ContractCard = ({ item }: { item: ContractItem }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col justify-between p-6 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
      onClick={() => handleConnect(item.type)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
      <div>
        <div className="text-3xl mb-4">{item.icon}</div>
        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
        <p className="text-white/70 text-sm">{item.description}</p>
      </div>
      <div className="mt-4 flex justify-end">
        <ArrowTopRightIcon className="w-5 h-5 text-purple-400" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <div className="flex py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sidebar />
        </motion.div>
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r text-white bg-clip-text text-transparent mb-4">
              Starknet Contracts
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Connect your wallet and try signing a transaction on Starknet
            </p>
          </motion.div>

          {account && (
            <div className="text-center mb-8">
              <p className="text-green-400">✅ Connected: {account}</p>
              <button
                onClick={signTransaction}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
              >
                Sign Test Transaction
              </button>
            </div>
          )}

          <div className="space-y-16">
            {contracts.map((section, sectionIndex) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {section.category}
                  </h2>
                  <p className="text-white/70">{section.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item) => (
                    <ContractCard key={item.title} item={item} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <DevXFooter />
    </div>
  );
}
