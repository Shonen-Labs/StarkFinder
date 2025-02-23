"use client";
import React from "react";
import Image from "next/image";
import { useState } from "react";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo } from "../../types/crypto-coin";
import { useAccount } from "@starknet-react/core";
import { v4 as uuidv4 } from "uuid";
import { TransactionSuccess } from "@/components/TransactionSuccess";


interface SwapProps {
	setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
}

interface TransactionHandlerProps {
	transactions: Array<{
		contractAddress: string;
		entrypoint: string;
		calldata: string[];
	}>;
	description: string;
	onSuccess: (hash: string) => void;
	onError: (error: any) => void;
}

const TransactionHandler: React.FC<TransactionHandlerProps> = ({ transactions, description, onSuccess, onError }) => {
	const { account } = useAccount();
	const [isProcessing, setIsProcessing] = React.useState(false);

	const executeTransaction = async () => {
		if (!account) {
			onError(new Error("Wallet not connected"));
			return;
		}

		setIsProcessing(true);
		try {
			for (const tx of transactions) {
				const response = await account.execute({
					contractAddress: tx.contractAddress,
					entrypoint: tx.entrypoint,
					calldata: tx.calldata,
				});
				await account.waitForTransaction(response.transaction_hash);
				if (tx === transactions[transactions.length - 1]) {
					onSuccess(response.transaction_hash);
				}
			}
		} catch (error) {
			console.error("Transaction failed:", error);
			onError(error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
			<p className="text-sm text-white/80 mb-4">{description}</p>
			<button
				onClick={executeTransaction}
				disabled={isProcessing}
				className={`w-full py-2 px-4 rounded-lg ${isProcessing ? "bg-white/20 cursor-not-allowed" : "bg-white/10 hover:bg-white/20"} transition-colors duration-200`}>
				{isProcessing ? "Processing Transaction..." : "Execute Transaction"}
			</button>
		</div>
	);
};

const Swap: React.FC<SwapProps> = ({ setSelectedCommand }) => {
	const [fromAmount, setFromAmount] = useState<string>("");
	const [toAmount, setToAmount] = useState<string>("");
	const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
	const [toCoin, setToCoin] = useState<CryptoCoin>(CoinsLogo[3]);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
	const [isLoading, setIsLoading] = useState(false);
	const [txHash, setTxHash] = useState<string | null>(null);
	const [transactionData, setTransactionData] = useState<Message["transaction"] | null>(null);

	const [messages, setMessages] = React.useState<Message[]>([]);

	interface Message {
		role: string;
		id: string;
		content: string;
		timestamp: string;
		user: string;
		transaction?: {
			data: {
				transactions: Array<{
					contractAddress: string;
					entrypoint: string;
					calldata: string[];
				}>;
				fromToken?: CryptoCoin;
				toToken?: CryptoCoin;
				fromAmount?: string;
				toAmount?: string;
				receiver?: string;
				gasCostUSD?: string;
				solver?: string;
			};
			type: string;
		};
		recommendations?: {
			pools: Array<{
				name: string;
				apy: number;
				tvl: number;
				riskLevel: string;
				impermanentLoss: string;
				chain: string;
				protocol: string;
			}>;
			strategy: string;
		};
	}

	const { address, account } = useAccount();

	const handleTransactionSuccess = (hash: string) => {
		setTxHash(hash);
		const successMessage: Message = {
			id: uuidv4(),
			role: "agent",
			content: "Swap completed successfully! Would you like to perform another swap?",
			timestamp: new Date().toLocaleTimeString(),
			user: "Agent",
		};
		setMessages((prev) => [...prev, successMessage]);
	};
	
  const handleSwap = async () => {
		if (!fromAmount || !fromCoin || !toCoin) return;

		if (!account) {
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

		setIsLoading(true);

		try {
			const response = await fetch("/api/transactions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: `swap ${fromAmount} ${fromCoin.name} to ${toCoin.name}`,
					address: address || 0x0,
					messages: messages,
				}),
			});

			const data = await response.json();

			if (response.ok && data.result?.[0]?.data) {
				const { transaction } = data.result[0].data;
				setTransactionData(transaction);
			} else {
				throw new Error("Failed to get transaction data");
			}
		} catch (error) {
			console.error("Swap failed:", error);
			const errorMessage: Message = {
				id: uuidv4(),
				role: "agent",
				content: "Sorry, the swap transaction failed. Please try again.",
				timestamp: new Date().toLocaleTimeString(),
				user: "Agent",
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

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

	const handleInputSwap = () => {
		setFromAmount(toAmount);
		setToAmount(fromAmount);
		setFromCoin(toCoin);
		setToCoin(fromCoin);
	};
	return (
		<div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex flex-col items-center justify-center animated fadeIn">
			<div className="bg-white p-6 max-w-lg w-full shadow-lg rounded-xl animated fadeIn">
				<div className="flex items-start">
					<button
						className="text-xl font-light text-black"
						onClick={() => setSelectedCommand(null)}>
						✕
					</button>
					<div className={`text-center flex-1`}>
						<h2 className="text-center text-2xl text-black font-bold mb-2">Swap Token</h2>
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
							onChange={(e) => setFromAmount(e.target.value)}
							className={`text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
						/>
					</div>
					<div
						className="flex items-center space-x-2 cursor-pointer"
						onClick={() => openModal("from")}>
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
						<ArrowDownUp
							className="text-[#060606]"
							onClick={handleInputSwap}
						/>
					</span>
				</div>

				<div className="border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center">
					<div>
						<p className="text-gray-400 text-sm">To</p>
						<input
							type="number"
							placeholder="Amount"
							value={toAmount}
							onChange={(e) => setToAmount(e.target.value)}
							readOnly={true}
							className={`text-xl font-bold text-black outline-none bg-transparent w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
						/>
					</div>
					<div
						className="flex items-center space-x-2 cursor-pointer"
						onClick={() => openModal("to")}>
						<Image
							src={toCoin.logo}
							alt={toCoin.name}
							width={30}
							height={30}
						/>
						<p className="font-bold text-black">{toCoin.name}</p>
						<ChevronDown className="text-black" />
					</div>
				</div>

				<div className={`mt-5`}>
					{txHash ? (
						<TransactionSuccess
							type="swap"
							hash={txHash}
							onNewTransaction={() => {
								setTxHash(null);
								setTransactionData(null);
							}}
						/>
					) : transactionData?.data?.transactions ? (
						<TransactionHandler
							transactions={transactionData.data.transactions}
							description={`Ready to execute swap transaction`}
							onSuccess={handleTransactionSuccess}
							onError={(error) => {
								console.error("Transaction failed:", error);
								const errorMessage: Message = {
									id: uuidv4(),
									role: "agent",
									content: "Transaction failed. Please try again.",
									timestamp: new Date().toLocaleTimeString(),
									user: "Agent",
								};
								setMessages((prev) => [...prev, errorMessage]);
							}}
						/>
					) : (
						<button
							className="bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center"
							onClick={handleSwap}
							disabled={isLoading}>
							{isLoading ? "Processing..." : "Swap"}
						</button>
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

export default Swap;
