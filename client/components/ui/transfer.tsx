"use client";
import React from "react";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const openModal = () => {
    setShowModal(true);
  };

  const handleCoinSelect = () => {
    setShowModal(false);
  };

  // Handle Tranfer
  const handleTransfer = async () => {
    setError("");

    if(!fromAmount || !walletAddress || !fromCoin) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'transfer',
          prompt: `Transfer ${fromAmount} ${fromCoin.name} to ${walletAddress}`,
          address: walletAddress,
          data: {
            amount: fromAmount,
            token: fromCoin.name,
            recipient: walletAddress
          }
        })
      });

      const data = await response.json();

      if(!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setSelectedCommand(null);

      alert('Transfer initiated successfully')
    } catch(err){
      setError(err instanceof Error ? err.message : "An error occured");
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex flex-col items-center justify-center animated fadeIn">
      <div className="bg-white p-6 max-w-lg w-full shadow-lg rounded-xl animated fadeIn">
        <div className="flex items-start">
          <button
            className="text-xl font-light text-black"
            onClick={() => setSelectedCommand(null)}
          >
            ✕
          </button>
          <div className={`text-center flex-1`}>
            <h2 className="text-center text-2xl text-black font-bold mb-2">
              Transfer Token
            </h2>
            <p className="text-gray-500 text-sm">Total Balance</p>
            <p className={`text-lg font-bold text-black`}>$11,485.30 </p>
          </div>
        </div>

        <div className="mt-6 border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
          <div>
            <input
              type="number"
              placeholder="Amount"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className={`text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
          </div>
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => openModal()}
          >
            <Image
              src={fromCoin.logo}
              alt={fromCoin.name}
              width={30}
              height={30}
            />
            <p className="font-bold text-black">{fromCoin.name}</p>
            <ChevronDown className="text-black" />
          </div>
        </div>

        <div className="mt-6 border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Recievers wallet address</p>
            <input
              type="text"
              placeholder="Wallet Address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className={`text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="mt-2 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className={`mt-5`}>
          <button className={`bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleTransfer} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Transfer'}
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
