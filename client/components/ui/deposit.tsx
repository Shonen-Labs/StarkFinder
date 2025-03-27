"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo } from "../../types/crypto-coin";
import { useAccount } from "@starknet-react/core";
import { TransactionHandler } from "../TransactionHandler";
import { fetchTokenBalance, createDepositTransaction } from "../../lib/token-utils";

interface DepositProps {
  setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
}

interface TransactionData {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

// Supported tokens for Nostra
const SUPPORTED_TOKENS = ["STRK", "ETH"];

const Deposit: React.FC<DepositProps> = ({ setSelectedCommand }) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]); // Default to STRK
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  
  const { address, account } = useAccount();

  // Fetch token balance when token or address changes
  useEffect(() => {
    const getBalance = async () => {
      if (!address || !account || !fromCoin) return;
      
      setIsLoadingBalance(true);
      try {
        const balance = await fetchTokenBalance(account, address, fromCoin.name, false);
        setTokenBalance(balance);
      } catch (err) {
        console.error("Error fetching balance:", err);
        setTokenBalance("0");
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    getBalance();
  }, [address, fromCoin, account]);

  const openModal = (type: "from" | "to") => {
    setSelectingCoinFor(type);
    setShowModal(true);
  };

  const handleCoinSelect = (coin: CryptoCoin) => {
    // Only allow supported tokens for Nostra deposits
    if (!SUPPORTED_TOKENS.includes(coin.name)) {
      setError(`Only ${SUPPORTED_TOKENS.join(" and ")} are supported for deposits`);
      return;
    }
    
    if (selectingCoinFor === "from") {
      setFromCoin(coin);
      setError(null);
    }
    setShowModal(false);
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const prepareDepositTransaction = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
  
    if (!address) {
      setError("Please connect your wallet!");
      return;
    }

    if (!SUPPORTED_TOKENS.includes(fromCoin.name)) {
      setError(`Only ${SUPPORTED_TOKENS.join(" and ")} are supported for deposits`);
      return;
    }

    // Check if amount is greater than balance
    if (parseFloat(fromAmount) > parseFloat(tokenBalance)) {
      setError(`Insufficient balance. You have ${tokenBalance} ${fromCoin.name}`);
      return;
    }
  
    setIsPreparing(true);
    setError(null);
    setTransactions([]);
    setTxHash(null);
  
    try {
      // Create Nostra deposit transactions using utility function
      const depositTransactions = createDepositTransaction(
        fromCoin.name,
        fromAmount,
        address
      );
      
      setTransactions(depositTransactions);
    } catch (err: any) {
      console.error("Error preparing deposit transaction:", err);
      setError(err.message || "Failed to prepare deposit transaction");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleTransactionSuccess = (hash: string) => {
    setTxHash(hash);
    setTimeout(() => {
      setSelectedCommand(null);
    }, 2000);
  };

  const handleTransactionError = (error: any) => {
    console.error("Transaction error:", error);
    if (error?.message?.includes("u256_sub Overflow")) {
      setError("Transaction failed: Insufficient balance. Try a smaller amount.");
    } else {
      setError("Transaction failed: " + (error?.message || "Unknown error"));
    }
  };

  // Filter coins to only show supported tokens
  const filteredCoins = CoinsLogo.filter(coin => 
    SUPPORTED_TOKENS.includes(coin.name)
  );

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
              Deposit Token
            </h2>
            <p className="text-gray-500 text-sm">Available Balance</p>
            <p className={`text-lg font-bold text-black`}>
              {isLoadingBalance ? "Loading..." : `${tokenBalance} ${fromCoin.name}`}
            </p>
          </div>
        </div>

        <div className="mt-6 border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">From</p>
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
            onClick={() => openModal("from")}
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

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="mt-2 flex justify-end">
          <button 
            className="text-blue-500 text-sm"
            onClick={() => setFromAmount(tokenBalance)}
          >
            Max
          </button>
        </div>

        <div className={`mt-5`}>
          {!txHash && !transactions.length && (
            <button 
              className="bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center disabled:opacity-50"
              onClick={prepareDepositTransaction}
              disabled={isPreparing || !address || isLoadingBalance}
            >
              {isPreparing ? "Preparing..." : "Prepare Deposit"}
            </button>
          )}

          {transactions.length > 0 && !txHash && (
            <TransactionHandler
              transactions={transactions}
              description={`Deposit ${fromAmount} ${fromCoin.name} to Nostra`}
              onSuccess={handleTransactionSuccess}
              onError={handleTransactionError}
            />
          )}

          {txHash && (
            <div className="text-green-500 text-center">
              Transaction Successful! Hash: {txHash}
            </div>
          )}
        </div>

        {showModal && (
          <TokensModal
            blockchain_logo={filteredCoins}
            handleCoinSelect={handleCoinSelect}
            setShowModal={setShowModal}
          />
        )}
      </div>
    </div>
  );
};

export default Deposit;

