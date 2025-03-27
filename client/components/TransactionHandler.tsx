/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount, useContract } from '@starknet-react/core';
import { useState } from 'react';

interface TransactionData {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export const TransactionHandler = ({ 
  transactions,
  description,
  onSuccess,
  onError 
}: {
  transactions: TransactionData[];
  description: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: any) => void;
}) => {
  const { account } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  const executeTransaction = async () => {
    if (!account) {
      onError?.('Wallet not connected');
      return;
    }

    setIsProcessing(true);
    try {
      // execute all transactions in sequence
      for (const tx of transactions) {
        const response = await account.execute({
          contractAddress: tx.contractAddress,
          entrypoint: tx.entrypoint,
          calldata: tx.calldata
        });

        //wait for transaction acceptance
        await account.waitForTransaction(response.transaction_hash);
      }

      onSuccess?.(transactions[transactions.length - 1].contractAddress);
    } catch (error) {
      console.error('Transaction failed:', error);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-black mb-4">{description}</p>
      <button
        onClick={executeTransaction}
        disabled={isProcessing}
        className={`bg-[#060606] text-white w-full py-3 rounded-2xl text-lg flex items-center justify-center ${
          isProcessing
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-[#2a2a2a] transition-colors duration-200'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Execute Transaction'}
      </button>
    </div>
  );
};