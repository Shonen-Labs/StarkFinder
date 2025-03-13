/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo } from "../../types/crypto-coin";
import { useAccount } from "@starknet-react/core";
import { TransactionHandler } from "../TransactionHandler";

interface BridgeProps {
  setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
}

interface TransactionData {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

const Bridge: React.FC<BridgeProps> = ({ setSelectedCommand }) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
  const [toCoin, setToCoin] = useState<CryptoCoin>(CoinsLogo[3]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  const { account, address } = useAccount();

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

  const handleInputBridge = () => {
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setFromCoin(toCoin);
    setToCoin(fromCoin);
  };

  const prepareBridgeTransaction = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
  
    if (!address) {
      setError("Please connect your wallet!");
      return;
    }
  
    setIsPreparing(true);
    setError(null);
    setTransactions([]);
    setTxHash(null);
  
    try {
      const requestBody = {
        prompt: `Bridge ${fromAmount} ${fromCoin.name} from ${fromCoin.chain} to ${toCoin.name} on ${toCoin.chain}`, // Include source and dest chains
        address,
        messages: [],
        stream: false,
        chainId: "4012", 
      };
  
      console.log("Request Body:", JSON.stringify(requestBody, null, 2));
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      console.log("Response status:", response.status); 
      const responseText = await response.text(); 
      console.log("Response text:", responseText);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }
  
      const data = await response.json();
      console.log("Parsed Response:", data); 
      if (data.result?.[0]?.data?.transaction?.data?.transactions) {
        const fetchedTransactions: TransactionData[] = data.result[0].data.transaction.data.transactions;
        if (fetchedTransactions.length === 0) {
          throw new Error("No transactions returned by API");
        }
        setTransactions(fetchedTransactions);
        setToAmount(fromAmount);
      } else {
        throw new Error("No transaction data received from API");
      }
    } catch (err: any) {
      console.error("Error preparing bridge transaction:", err);
      setError(err.message || "Failed to prepare bridge transaction");
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
    setError("Transaction failed: " + (error?.message || "Unknown error"));
  };

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
          <div className="text-center flex-1">
            <h2 className="text-center text-2xl text-black font-bold mb-2">Bridge Token</h2>
            <p className="text-gray-500 text-sm">Total Balance</p>
            <p className="text-lg font-bold text-black">$11,485.30</p>
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
              className="text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => openModal("from")}
          >
            <Image src={fromCoin.logo} alt={fromCoin.name} width={30} height={30} />
            <p className="font-bold text-black">{fromCoin.name}</p>
            <ChevronDown className="text-black" />
          </div>
        </div>

        <div className="flex justify-center my-4">
          <span className="text-2xl cursor-pointer">
            <ArrowDownUp className="text-[#060606]" onClick={handleInputBridge} />
          </span>
        </div>

        <div className="border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">To</p>
            <input
              type="number"
              placeholder="Amount"
              value={toAmount}
              readOnly={true}
              className="text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => openModal("to")}
          >
            <Image src={toCoin.logo} alt={toCoin.name} width={30} height={30} />
            <p className="font-bold text-black">{toCoin.name}</p>
            <ChevronDown className="text-black" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="mt-5">
          {!txHash && !transactions.length && (
            <button
              className="bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center disabled:opacity-50"
              onClick={prepareBridgeTransaction}
              disabled={isPreparing || !account}
            >
              {isPreparing ? "Preparing..." : "Prepare Bridge"}
            </button>
          )}

          {transactions.length > 0 && !txHash && (
            <TransactionHandler
              transactions={transactions}
              description={`Bridge ${fromAmount} ${fromCoin.name} to ${toCoin.name}`}
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
            blockchain_logo={CoinsLogo}
            handleCoinSelect={handleCoinSelect}
            setShowModal={setShowModal}
          />
        )}
      </div>
    </div>
  );
};

export default Bridge;