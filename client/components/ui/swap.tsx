"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { useState } from "react";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import TokensModal from "./tokens-modal";
import { CryptoCoin, CoinsLogo } from "../../types/crypto-coin";
import { useAccount } from "@starknet-react/core";
import useDebounce from "../useDebounce";
import { fetchTokenBalance} from "../../lib/token-utils";

interface SwapProps {
	setSelectedCommand: React.Dispatch<React.SetStateAction<string | null>>;
}

const Swap: React.FC<SwapProps> = ({ setSelectedCommand }) => {
	const { address, account } = useAccount();

	const [fromAmount, setFromAmount] = useState<string>("");
	const [toAmount, setToAmount] = useState<string>("");
	const [fromCoin, setFromCoin] = useState<CryptoCoin>(CoinsLogo[0]);
	const [toCoin, setToCoin] = useState<CryptoCoin>(CoinsLogo[3]);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [selectingCoinFor, setSelectingCoinFor] = useState<"from" | "to">("from");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tokenBalance, setTokenBalance] = useState<string>("0");
	/* eslint-disable */
	const [transactionDetails, setTransactionDetails] = useState<any>(null);
	const [txHash, setTxHash] = useState<string | null>(null);
	const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);

	// Debounce the fromAmount with a 1 second delay
	const debouncedFromAmount = useDebounce(fromAmount, 1000);

	// Effect to trigger handleSwap when the debounced value changes
	useEffect(() => {
		const fetchData = async () => {
			// Fetch token balance
			if (address && account && fromCoin.name) {
				setIsLoadingBalance(true);
				try {
					const balance = await fetchTokenBalance(
						account,
						address,
						fromCoin.name,
						false 
					);
					setTokenBalance(balance);
				} catch (error) {
					console.error("Error fetching token balance:", error);
					setTokenBalance("0");
				} finally {
					setIsLoadingBalance(false);
				}
			}

			if (debouncedFromAmount) {
				handleSwap(debouncedFromAmount);
			}
		};

		fetchData();
	}, [debouncedFromAmount, address, account, fromCoin.name]);

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

	const handleSwap = async (value?: string) => {
		const prompt = `swap ${value} ${fromCoin.name} to ${toCoin.name}`;
		const messages = [
			{
				role: "user",
				content: prompt,
			},
		];
		const requestBody = {
			prompt,
			address: address || "0x0",
			messages,
			chainId: "4012",
		};
		setIsLoading(true);
		const response = await fetch("/api/transactions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (data?.result) {
			setIsLoading(false);
			const resTx = data?.result;
			const amt = resTx?.[0]?.data?.transaction?.data?.toAmount;
			setTransactionDetails(resTx?.[0].data.transaction.data.transactions);
			setToAmount(amt);
		} else {
			setIsLoading(false);
		}
	};

	const handleExecuteTransaction = async () => {
		try {
			const txDetails = transactionDetails;
			const result = await account?.execute(txDetails);

			if (result?.transaction_hash) {
				setTxHash(result.transaction_hash);
				console.log("Transaction submitted:", txHash);
			}
		} catch (error) {
			console.error("Transaction failed:", error);
		}
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
						<p className="text-gray-500 text-sm">Token Balance</p>
						<p className={`text-lg font-bold text-black`}>
							{isLoadingBalance ? (
								"Loading..."
							) : (
								<>
									{Number(tokenBalance).toLocaleString(undefined, {
										maximumFractionDigits: 4,
									})}{" "}
									{fromCoin.name}
								</>
							)}
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
					{transactionDetails ? (
						<button
							onClick={() => handleExecuteTransaction()}
							className="bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center">
							Execute Swap
						</button>
					) : (
						<button
							disabled={isLoading}
							className="bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center"
							onClick={() => handleSwap()}>
							{isLoading ? "Getting Quote..." : "Swap"}
						</button>
					)}
				</div>

				{txHash && <div>Transaction submitted: {txHash}</div>}
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
