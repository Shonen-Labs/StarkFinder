"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";
import { Contract } from "@/types/profile";

interface ContractCardProps {
  contract: Contract;
  type: "deployed" | "generated";
}

export function ContractCard({ contract, type }: ContractCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!contract.contractAddress) return;
    navigator.clipboard.writeText(contract.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800 bg-opacity-70 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-700"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-white truncate">
            {contract.name}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              type === "deployed"
                ? "bg-green-800 text-green-100"
                : "bg-blue-800 text-blue-100"
            }`}
          >
            {type === "deployed" ? "Deployed" : "Generated"}
          </span>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {contract.description || "No description provided"}
        </p>

        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Contract Address</div>
          <div className="bg-gray-700 p-3 rounded-lg text-xs text-gray-200 font-mono flex items-center justify-between gap-2">
            <span className="truncate">
              {contract.contractAddress || "Not deployed yet"}
            </span>

            {contract.contractAddress && (
              <button
                onClick={handleCopy}
                className={`${copied ? "text-green-400" : "text-gray-400"} hover:text-white transition-colors`}
                title="Copy address"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {copied && (
            <div className="text-green-400 text-xs mt-2 flex items-center gap-1">
              <span>✓</span> Copied to clipboard!
            </div>
          )}

          {contract.contractAddress && (
            <a
              href={`https://sepolia.starkscan.co/contract/${contract.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 mt-2 inline-flex items-center gap-1 hover:underline"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            Created {new Date(contract.createdAt).toLocaleDateString()}
          </span>
          {contract.updatedAt && (
            <span>
              Updated {new Date(contract.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 px-6 py-4 flex justify-between">
        <button className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          View Details
        </button>
        {type === "generated" && !contract.contractAddress && (
          <button className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
            Deploy Contract
          </button>
        )}
      </div>
    </motion.div>
  );
} 