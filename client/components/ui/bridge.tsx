"use client";
import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ArrowDownUp, ChevronDown, Loader2 } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo } from "../../types/crypto-coin";
import { useAccount } from "@starknet-react/core";
import { toast } from "react-hot-toast";

interface BridgeProps {
  setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
}

const MIN_BRIDGE_AMOUNT = process.env.NEXT_PUBLIC_MIN_BRIDGE_AMOUNT ? parseFloat(process.env.NEXT_PUBLIC_MIN_BRIDGE_AMOUNT) : 0.01;
const MAX_BRIDGE_AMOUNT = process.env.NEXT_PUBLIC_MAX_BRIDGE_AMOUNT ? parseFloat(process.env.NEXT_PUBLIC_MAX_BRIDGE_AMOUNT) : 1000;

const Bridge: React.FC<BridgeProps> = ({ setSelectedCommand }) => {
  const { address } = useAccount();
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
  const [toCoin, setToCoin] = useState<CryptoCoin>(CoinsLogo[3]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<CryptoCoin[]>([]);

  useEffect(() => {
    const fetchAvailableTokens = async () => {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'select coin',
            address: address,
            chainId: '4012',
            messages: [{ sender: 'user', content: 'select coin' }],
          }),
        });

        const data = await response.json();
        if (data.result?.[0]?.data?.description) {
          const tokenList = data.result[0].data.description
            .split('\n')[0] // Get first line which contains the token list
            .replace('Available tokens for bridging:', '')
            .split(',')
            .map(token => token.trim())
            .filter(Boolean);

          // Convert token symbols to CryptoCoin objects
          const availableCoins = CoinsLogo.filter(coin => 
            tokenList.includes(coin.symbol)
          );

          setAvailableTokens(availableCoins);
          if (availableCoins.length > 0) {
            setFromCoin(availableCoins[0]);
            setToCoin(availableCoins[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching available tokens:', error);
        setError('Failed to fetch available tokens');
      }
    };

    if (address) {
      fetchAvailableTokens();
    }
  }, [address]);

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

  const validateBridgeAmount = useCallback((amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (parsedAmount < MIN_BRIDGE_AMOUNT) {
      setError(`Minimum bridge amount is ${MIN_BRIDGE_AMOUNT}`);
      return false;
    }
    if (parsedAmount > MAX_BRIDGE_AMOUNT) {
      setError(`Maximum bridge amount is ${MAX_BRIDGE_AMOUNT}`);
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleBridge = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validateBridgeAmount(fromAmount)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Bridge ${fromAmount} ${fromCoin.symbol} from ${fromCoin.network} to ${toCoin.network}`,
          address: address,
          chainId: "4012",
          messages: [],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Bridge transaction initiated successfully!");
        setSelectedCommand(null);
      } else {
        throw new Error(data.error || "Failed to initiate bridge");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate bridge");
      setError(error.message || "Failed to initiate bridge");
    } finally {
      setIsLoading(false);
    }
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
          <div className={`text-center flex-1`}>
            <h2 className="text-center text-2xl text-black font-bold mb-2">
              Bridge Token
            </h2>
            <p className="text-gray-500 text-sm">Total Balance</p>
            <p className={`text-lg font-bold text-black`}>$11,485.30 </p>
          </div>
        </div>

        <div className="mt-6 border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">From</p>
            <input
              type="number"
              placeholder="Amount"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value);
                setToAmount(e.target.value);
                validateBridgeAmount(e.target.value);
              }}
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
              onChange={(e) => {
                setToAmount(e.target.value);
                setFromAmount(e.target.value);
                validateBridgeAmount(e.target.value);
              }}
              readOnly={true}
              className={`text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
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

        {error && (
          <div className="mt-2 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className={`mt-5`}>
          <button 
            onClick={handleBridge}
            disabled={isLoading || !fromAmount || !!error}
            className={`
              bg-[#060606] text-white w-full py-3 rounded-2xl text-lg 
              flex items-center justify-center
              ${(isLoading || !fromAmount || !!error) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Bridging...
              </>
            ) : (
              'Bridge'
            )}
          </button>
        </div>

        {showModal && (
          <TokensModal
            blockchain_logo={availableTokens}
            handleCoinSelect={handleCoinSelect}
            setShowModal={setShowModal}
          />
        )}
      </div>
    </div>
  );
};

export default Bridge;
