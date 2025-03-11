"use client";
import React from "react";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ExternalLink, Loader } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo} from "../../types/crypto-coin";
import { Message } from "@/app/tg/types";
import { useAccount } from "@starknet-react/core";
import { v4 as uuidv4 } from "uuid";

interface UserPreferences {
  riskTolerance: "low" | "medium" | "high";
  preferredAssets: string[];
  preferredChains: string[];
  investmentHorizon: "short" | "medium" | "long";
}

interface DepositProps {
  setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
  setInputValue?: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDepositModal?: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  messages?: Message[];
  userPreferences?: UserPreferences;
  inputValue?: string;
  isLoading?: boolean;
}

const Deposit: React.FC<DepositProps> = ({ 
  setSelectedCommand,
  setMessages,
  inputValue = "",
  setInputValue,
  setIsLoading,
  userPreferences,
  messages = [],
  isLoading = false,
  setShowDepositModal
}) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
  
  const { address } = useAccount();
  
  const openModal = (type: "from" | "to") => {
    setSelectingCoinFor(type);
    setShowModal(true);
  };

  const handleCoinSelect = (coin: CryptoCoin) => {
    if (selectingCoinFor === "from") {
      setFromCoin(coin);
    }
    setShowModal(false);
  };
  
  const handleDeposit = async () => {
    if (setShowDepositModal) setShowDepositModal(false);
    setSelectedCommand(null);
    
    if (!address) {
      if (setMessages) {
        const errorMessage: Message = {
          id: uuidv4(),
          role: "agent",
          content: "Please connect your wallet first to proceed with the deposit.",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      return;
    }

    // Create deposit message
    const depositMessage = `Deposit ${fromAmount} ${fromCoin.name}`;
    
    if (setMessages && setInputValue && setIsLoading) {
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: depositMessage,
        timestamp: new Date().toLocaleTimeString(),
        user: "User",
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 135000);

      try {
        // Call the transactions API
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: depositMessage,
            address: address,
            messages: messages,
            userPreferences: userPreferences || {
              riskTolerance: "medium",
              preferredAssets: [fromCoin.name],
              preferredChains: ["starknet"],
              investmentHorizon: "medium"
            },
            stream: true,
          }),
          signal: controller.signal,
        });

        const data = await response.json();
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
              "I'm sorry, I couldn't process your deposit request. Please try again with a different amount or token.",
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
          content: "Sorry, something went wrong with your deposit. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
          user: "Agent",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
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
          <p className="text-gray-400 text-sm">Total Balance</p>
          <p className="text-2xl font-bold text-white">$11,485.30</p>
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
            onClick={handleDeposit} 
            className="bg-[#457650] text-white py-3 rounded-lg text-lg flex items-center justify-center space-x-2 hover:bg-[#508c5c] transition-colors duration-200"
          >
            <span>{isLoading ? <Loader className="animate-spin" color="white" size={16} /> : "Confirm Deposit"}</span>
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

export default Deposit;

