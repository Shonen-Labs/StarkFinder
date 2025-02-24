"use client";
import React from "react";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo} from "../../types/crypto-coin";

interface TransferProps {
  setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
}

const Transfer: React.FC<TransferProps> = ({ setSelectedCommand }) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [fromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const openModal = () => {
    setShowModal(true);
  };

  const handleCoinSelect = () => {
    setShowModal(false);
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
            onClick={() => openModal()}
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
          <p className="text-gray-400 text-sm mb-2">Receiver's Address</p>
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
          <button className="bg-[#457650] text-white py-3 rounded-lg text-lg flex items-center justify-center space-x-2 hover:bg-[#508c5c] transition-colors duration-200">
            <span>Confirm Transaction</span>
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
