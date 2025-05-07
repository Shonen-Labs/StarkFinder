"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ExternalLink, Loader } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo } from "../../types/crypto-coin";
import { Message } from "@/legacy/tg/types";
import { useAccount } from "@starknet-react/core";
import { v4 as uuidv4 } from "uuid";
import { fetchTokenBalance} from "../../lib/token-utils";

interface UserPreferences {
  riskTolerance: "low" | "medium" | "high";
  preferredAssets: string[];
  preferredChains: string[];
  investmentHorizon: "short" | "medium" | "long";
}

interface TransferProps {
  setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;  // Changed from string | null to string
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;  // Changed from boolean | null to boolean
  setShowTransferModal: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;  // Changed from Message[] | null to Message[]
  messages: Message[];
  userPreferences: UserPreferences;  // Changed from any to UserPreferences
  inputValue: string;
  isLoading: boolean;
}

const Transfer: React.FC<TransferProps> = ({ 
  setSelectedCommand, 
  setMessages, 
  inputValue, 
  setInputValue, 
  setIsLoading, 
  userPreferences, 
  messages, 
  isLoading, 
  setShowTransferModal 
}) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
  const [toCoin, setToCoin] = useState<CryptoCoin>(CoinsLogo[3]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  
  console.log("input value", inputValue);
  console.log(toCoin);
  
  const { address, account } = useAccount();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !account || !fromCoin.name) return;
      
      setIsLoadingBalance(true);
      try {
        const balance = await fetchTokenBalance(
          account,
          address,
          fromCoin.name,
          false // or true if you need interest-bearing balance
        );
        setTokenBalance(balance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setTokenBalance("0");
      } finally {
        setIsLoadingBalance(false);
      }
    };
  
    fetchBalance();
  }, [address, account, fromCoin.name]);
  
  const openModal = (type: "from" | "to") => {
    setSelectingCoinFor(type);
    setShowModal(true);
  };

  const handleCoinSelect = (coin: CryptoCoin) => {
    if (selectingCoinFor === "from") {
      setFromCoin(coin);
    } else {
      setToCoin(coin);
    }
    setShowModal(false);
  };
  
  const handleTransfer = async () => {
    setShowTransferModal(false);
    setSelectedCommand(null);
    
    if (!inputValue.trim()) return;
    if (!address) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Please connect your wallet first to proceed with the transaction.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      user: "User",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 135000);

    try {
      // this is where the endpoint is meant to be called I am not sure if the endpoint is correct
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputValue,
          address: address,
          messages: messages,
          userPreferences,
          stream: true,
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      console.log(data);

      clearTimeout(timeoutId);

      let agentMessage: Message;

      if (
        data.error &&
        typeof data.error === "string" &&
        !data.error.includes("not recognized")
      ) {
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content: data.error,
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
      } else if (response.ok && data.result?.[0]?.data) {
        const { description, transaction } = data.result[0].data;
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content: description,
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
          transaction: transaction,
        };
      } else {
        agentMessage = {
          id: uuidv4(),
          role: "agent",
          content:
            "I'm sorry, I couldn't understand that. Could you try rephrasing your request? For example, you can say 'swap', 'transfer', 'deposit', or 'bridge'.",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
      }

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      if ((error instanceof Error) && error.name === "AbortError") {
        console.error("Frontend fetch request timed out");
      } else {
        console.error("Error:", error);
      }
      const errorMessage: Message = {
        id: uuidv4(),
        role: "agent",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        user: "Agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex flex-col items-center justify-center animated fadeIn">
      <div className="bg-[#1A1A1A] p-6 w-[36rem] shadow-lg rounded-xl animated fadeIn">
        <div className="flex items-start justify-between">
          <div className="text-gray-400 text-sm">
            {new Date().toLocaleTimeString()}
          </div>
          <button
            className="text-xl font-light text-gray-400"
            onClick={() => setSelectedCommand(null)}
          >
            ✕
          </button>
        </div>

        <div className="mt-6 bg-[#242424] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Token Balance</p>
          <p className="text-2xl font-bold text-white">
            {isLoadingBalance ? (
              <Loader className="animate-spin inline" size={20} />
            ) : (
              `${Number(tokenBalance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })} ${fromCoin.name}`
            )}
          </p>
        </div>

        <div className="mt-6 bg-[#242424] rounded-lg p-4 flex justify-between items-center">
          <input
            type="number"
            placeholder="0.00"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-2xl font-bold text-white outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div
            className="flex items-center space-x-2 cursor-pointer bg-[#333333] px-3 py-2 rounded-lg"
            onClick={() => openModal("from")}
          >
            <Image
              src={fromCoin.logo}
              alt={fromCoin.name}
              width={20}
              height={20}
            />
            <p className="font-medium text-white">{fromCoin.name}</p>
            <ChevronDown className="text-white h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-2">Receiver&apos;s Address</p>
          <div className="bg-[#242424] rounded-lg p-4">
            <input
              type="text"
              placeholder="0x86ecca95fec..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="text-white outline-none bg-transparent w-full"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-400 text-sm text-right">Gas: ~$0</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            className="bg-[#242424] text-white py-3 rounded-lg text-lg hover:bg-[#2f2f2f] transition-colors duration-200"
            onClick={() => setSelectedCommand(null)}
          >
            Cancel
          </button>
          <button 
            onClick={handleTransfer} 
            className="bg-[#457650] text-white py-3 rounded-lg text-lg flex items-center justify-center space-x-2 hover:bg-[#508c5c] transition-colors duration-200"
          >
            <span>{isLoading ? <Loader className="animate-spin" color="white" size={16} /> : "Confirm Transaction"}</span>
            <ExternalLink className="h-5 w-5 mr-1" />
          </button>
        </div>

        {showModal && (
          <TokensModal
            blockchain_logo={CoinsLogo}
            handleCoinSelect={handleCoinSelect}
            setShowModal={setShowModal}
          />
        )}
      </div>
    </div>
  );
};

export default Transfer;