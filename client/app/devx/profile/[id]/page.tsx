"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import {
  Copy,
  Wallet,
  Home,
  Bot,
  Rocket,
  Settings,
  ChevronRight,
} from "lucide-react";
import { CachedContractsManager } from "@/components/cached-contracts/CachedContractsManager";
import OpenEditorButton from "@/components/OpenEditorButton";
import { DevXFooter } from "@/components/footer/footer";

type Contract = {
  id: string;
  name: string;
  description?: string;
  contractAddress?: string;
  createdAt: string;
  updatedAt?: string;
  sourceCode: string;
  scarbConfig?: string;
  isDeployed?: boolean;
  deployedContractId?: string;
  deployedAt?: string;
};

type UserData = {
  name: string;
  email: string;
  address?: string;
  createdAt: string;
  deployedContracts: Contract[];
  generatedContracts: Contract[];
};

/* ------------------------- Sidebar (left nav) ------------------------- */
function Sidebar({
  current,
}: {
  current: "Home" | "Generated" | "Deployed" | "Settings";
}) {
  const Item = ({
    icon,
    label,
  }: {
    icon: React.ReactNode;
    label: "Home" | "Generated" | "Deployed" | "Settings";
  }) => (
    <button
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        current === label
          ? "bg-white/15 text-white"
          : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
    >
      <span className="grid place-items-center rounded-lg bg-white/10 group-hover:bg-white/15 h-8 w-8 border border-white/10">
        {icon}
      </span>
      <span>{label}</span>
      {current === label && (
        <ChevronRight className="ml-auto h-4 w-4 opacity-80" />
      )}
    </button>
  );

  return (
    <aside className="hidden lg:block w-64 shrink-0 sticky top-20 h-[calc(100vh-5rem)]">
      <div className="h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-3 space-y-2">
        <Item icon={<Home className="h-4 w-4" />} label="Home" />
        <Item icon={<Bot className="h-4 w-4" />} label="Generated" />
        <Item icon={<Rocket className="h-4 w-4" />} label="Deployed" />
        <div className="pt-1">
          <div className="px-3 pb-1 text-[11px] uppercase tracking-wider text-white/40">
            Preferences
          </div>
          <Item icon={<Settings className="h-4 w-4" />} label="Settings" />
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Navbar -------------------------------- */
function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/10 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-400 to-fuchsia-400 grid place-items-center">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white/90">
              StarkFinder
            </span>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-50 px-3 py-1.5 text-sm transition">
            <Wallet className="h-4 w-4" /> Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
}

/* --------------------------- Profile Page ----------------------------- */
export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "deployed" | "generated" | "cached"
  >("deployed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const id = params?.id;

  const fetchUserData = useCallback(async () => {
    if (!id) {
      setError("User ID is required");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${id}`);
      const data = await response.json();
      setUserData({
        ...data,
        deployedContracts: data.deployedContracts ?? [],
        generatedContracts: data.generatedContracts ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [id, fetchUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0620] text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0620] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg">{error}</div>
          <button
            onClick={fetchUserData}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#0B0620] text-white relative">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 flex gap-6">
        <Sidebar current="Settings" />

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold">User Profile</h1>
            <p className="text-white/60 max-w-prose">
              View and manage your deployed contracts, generated templates, and
              cached items.
            </p>
          </motion.div>

          {/* Profile Header */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-indigo-400 to-fuchsia-400 grid place-items-center">
                <span className="text-4xl font-bold">
                  {userData.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-semibold">
                  {userData.name || "Anonymous User"}
                </h2>
                <p className="text-white/60">{userData.email}</p>
                {userData.address && (
                  <p className="text-xs text-white/50 font-mono">
                    {userData.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-6">
            {(["deployed", "generated", "cached"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition ${
                  activeTab === tab
                    ? "border-b-2 border-fuchsia-400 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Contracts
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === "deployed" &&
            userData.deployedContracts.length > 0 ? (
              userData.deployedContracts.map((c) => (
                <ContractCard key={c.id} contract={c} type="deployed" />
              ))
            ) : activeTab === "generated" &&
              userData.generatedContracts.length > 0 ? (
              userData.generatedContracts.map((c) => (
                <ContractCard key={c.id} contract={c} type="generated" />
              ))
            ) : activeTab === "cached" ? (
              <div className="col-span-full">
                <CachedContractsManager userId={id as string} />
              </div>
            ) : (
              <div className="col-span-full text-center text-white/60 py-12">
                No {activeTab} contracts found.
              </div>
            )}
          </div>
        </div>
      </main>
      <DevXFooter />
    </div>
  );
}

/* --------------------------- Contract Card ---------------------------- */
function ContractCard({
  contract,
  type,
}: {
  contract: Contract;
  type: "deployed" | "generated";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!contract.contractAddress) return;
    navigator.clipboard.writeText(contract.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-white truncate">
            {contract.name}
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs ${
              type === "deployed"
                ? "bg-green-500/20 text-green-300"
                : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {type === "deployed" ? "Deployed" : "Generated"}
          </span>
        </div>

        <p className="text-white/60 text-sm mb-4 line-clamp-2">
          {contract.description || "No description provided"}
        </p>

        {/* Address + Explorer (restored behavior) */}
        <div className="mt-4">
          <div className="text-xs text-white/50 mb-1">Contract Address</div>

          <div className="bg-white/10 rounded px-3 py-2 text-xs font-mono flex justify-between items-center">
            <span className="truncate">
              {contract.contractAddress ?? "Not deployed yet"}
            </span>

            {contract.contractAddress && (
              <button
                onClick={handleCopy}
                className="hover:text-white transition"
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>

          {copied && <div className="text-green-400 text-xs mt-1">Copied!</div>}

          {contract.contractAddress && (
            <a
              href={`https://sepolia.starkscan.co/contract/${contract.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-300 mt-1 inline-flex items-center gap-1 hover:text-white"
            >
              View on Explorer
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h6m0 0v6m0-6L10 17"
                />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Footer actions (restored) */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
        <button className="text-indigo-300 hover:text-white text-sm transition-colors">
          View Details
        </button>

        {type === "generated" && !contract.contractAddress && (
          <OpenEditorButton
            contractCode={contract.sourceCode}
            contractName={contract.name}
            contractId={contract.id}
            classname="bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors py-1 px-2 rounded-md"
          />
        )}
      </div>

      {/* Timestamps */}
      <div className="flex justify-between items-center mt-4 text-xs text-white/50">
        <span>Created {new Date(contract.createdAt).toLocaleDateString()}</span>
        {contract.updatedAt && (
          <span>
            Updated {new Date(contract.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
