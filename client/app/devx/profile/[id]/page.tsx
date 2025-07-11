"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Copy, Code, ExternalLink, Calendar, FileText, Play, Trash2 } from "lucide-react";

type Contract = {
  id: string;
  name: string;
  description?: string;
  contractAddress?: string;
  sourceCode?: string;
  scarbConfig?: string;
  createdAt: string;
  updatedAt?: string;
  blockchain?: string;
};

type UserData = {
  name: string;
  email: string;
  address?: string;
  createdAt: string;
  deployedContracts: Contract[];
  generatedContracts: Contract[];
};

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"deployed" | "generated">("deployed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const fetchUserData = useCallback(async () => {
    if (!id) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/user/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate the response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data');
      }
      
      // Ensure arrays exist and are arrays
      const validatedData: UserData = {
        name: data.name || '',
        email: data.email || '',
        address: data.address || '',
        createdAt: data.createdAt || new Date().toISOString(),
        deployedContracts: Array.isArray(data.deployedContracts) ? data.deployedContracts : [],
        generatedContracts: Array.isArray(data.generatedContracts) ? data.generatedContracts : []
      };
      
      setUserData(validatedData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching user data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleteLoading(contractId);
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete contract: ${response.status}`);
      }

      // Update local state to remove the deleted contract
      setUserData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          generatedContracts: prev.generatedContracts.filter(contract => contract.id !== contractId),
          deployedContracts: prev.deployedContracts.filter(contract => contract.id !== contractId)
        };
      });

      // Show success message (you can replace this with a toast notification)
      alert('Contract deleted successfully');
    } catch (err) {
      console.error('Error deleting contract:', err);
      alert('Failed to delete contract. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleMoveToDeployed = async (contract: Contract, deploymentAddress: string) => {
    try {
      // Update the contract with deployment address
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: deploymentAddress,
          status: 'deployed'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update contract deployment status: ${response.status}`);
      }

      // Remove from generated contracts and add to deployed contracts
      const updatedContract = { ...contract, contractAddress: deploymentAddress };
      
      setUserData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          generatedContracts: prev.generatedContracts.filter(c => c.id !== contract.id),
          deployedContracts: [...prev.deployedContracts, updatedContract]
        };
      });

      // Optional: Delete from generated contracts database
      await handleDeleteFromGeneratedDB(contract.id);
      
    } catch (err) {
      console.error('Error moving contract to deployed:', err);
      alert('Failed to update contract deployment status');
    }
  };

  const handleDeleteFromGeneratedDB = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/generated/${contractId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to delete from generated contracts DB');
      }
    } catch (err) {
      console.error('Error deleting from generated DB:', err);
    }
  };

  const handleOpenEditor = (contract: Contract) => {
    try {
      const editorData = {
        contractId: contract.id,
        sourceCode: contract.sourceCode || "",
        scarbConfig: contract.scarbConfig || "",
        contractName: contract.name,
        blockchain: contract.blockchain || "blockchain1"
      };
      
      // Encode the data to pass to the editor
      const encodedData = encodeURIComponent(JSON.stringify(editorData));
      
      // Navigate to editor with contract data
      router.push(`/editor?contract=${encodedData}`);
    } catch (err) {
      console.error('Error opening editor:', err);
      alert('Failed to open editor');
    }
  };

  const handleViewCode = (contract: Contract) => {
    setSelectedContract(contract);
    setShowCodeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-500 text-xl">{error}</div>
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

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-white text-xl">No user data found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          User Profile
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          View and manage your activity—deployed contracts, generated templates,
          and on-chain contributions in one place.
        </p>
      </motion.div>
      
      <div className="max-w-7xl mx-auto">
        {/* User Profile Header */}
        <div className="bg-gray-800 bg-opacity-70 rounded-lg shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="rounded-full bg-purple-700 p-2 w-24 h-24 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white mb-2">
                {userData.name || "Anonymous User"}
              </h1>
              <p className="text-purple-200 mb-2">{userData.email}</p>
              {userData.address && (
                <p className="text-purple-200 mb-2 text-sm font-mono">
                  {userData.address}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-indigo-800 rounded-full text-xs text-indigo-100">
                  {userData.deployedContracts.length} Deployed
                </span>
                <span className="px-3 py-1 bg-purple-800 rounded-full text-xs text-purple-100">
                  {userData.generatedContracts.length} Generated
                </span>
                <span className="px-3 py-1 bg-blue-800 rounded-full text-xs text-blue-100">
                  Member since{" "}
                  {new Date(userData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={fetchUserData}
              className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-700">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "deployed"
                  ? "border-b-2 border-purple-500 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("deployed")}
            >
              Deployed Contracts ({userData.deployedContracts.length})
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "generated"
                  ? "border-b-2 border-purple-500 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("generated")}
            >
              Generated Contracts ({userData.generatedContracts.length})
            </button>
          </div>
        </div>

        {/* Contracts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "deployed" && userData.deployedContracts.length > 0 ? (
            userData.deployedContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                type="deployed"
                onViewCode={() => handleViewCode(contract)}
                onOpenEditor={() => handleOpenEditor(contract)}
                onDelete={() => handleDeleteContract(contract.id)}
                deleteLoading={deleteLoading === contract.id}
              />
            ))
          ) : activeTab === "generated" &&
            userData.generatedContracts.length > 0 ? (
            userData.generatedContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                type="generated"
                onViewCode={() => handleViewCode(contract)}
                onOpenEditor={() => handleOpenEditor(contract)}
                onDelete={() => handleDeleteContract(contract.id)}
                deleteLoading={deleteLoading === contract.id}
              />
            ))
          ) : (
            <div className="col-span-full text-center p-12">
              <div className="bg-gray-800 bg-opacity-70 rounded-lg p-8">
                <h3 className="text-xl font-medium text-white mb-2">
                  No {activeTab} contracts found
                </h3>
                <p className="text-gray-300">
                  {activeTab === "deployed"
                    ? "You haven't deployed any contracts yet."
                    : "You haven't generated any contracts yet."}
                </p>
                <button 
                  onClick={() => router.push('/editor')}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
                >
                  {activeTab === "deployed"
                    ? "Deploy Your First Contract"
                    : "Generate Your First Contract"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Modal */}
      {showCodeModal && selectedContract && (
        <CodeModal
          contract={selectedContract}
          onClose={() => {
            setShowCodeModal(false);
            setSelectedContract(null);
          }}
        />
      )}
    </div>
  );
}

function ContractCard({
  contract,
  type,
  onViewCode,
  onOpenEditor,
  onDelete,
  deleteLoading,
}: {
  contract: Contract;
  type: "deployed" | "generated";
  onViewCode: () => void;
  onOpenEditor: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!contract.contractAddress) return;
    
    try {
      await navigator.clipboard.writeText(contract.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = contract.contractAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBlockchainName = (blockchain?: string) => {
    switch (blockchain) {
      case "blockchain1":
        return "Cairo";
      case "blockchain4":
        return "Dojo";
      default:
        return "Unknown";
    }
  };

  const hasSourceCode = contract.sourceCode && contract.sourceCode.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800 bg-opacity-70 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-white truncate pr-2">
            {contract.name}
          </h3>
          <div className="flex flex-col gap-1">
            <span
              className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                type === "deployed"
                  ? "bg-green-800 text-green-100"
                  : "bg-blue-800 text-blue-100"
              }`}
            >
              {type === "deployed" ? "Deployed" : "Generated"}
            </span>
            {contract.blockchain && (
              <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 text-center">
                {getBlockchainName(contract.blockchain)}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {contract.description || "No description provided"}
        </p>

        {/* Contract Address Section */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">Contract Address</div>
          <div className="bg-gray-700 p-2 rounded text-xs text-gray-200 font-mono flex items-center justify-between gap-2">
            <span className="truncate">
              {contract.contractAddress || "Not deployed yet"}
            </span>

            {contract.contractAddress && (
              <button
                onClick={handleCopy}
                className={`${copied ? "text-green-400" : "text-gray-400"} hover:text-white transition`}
                title="Copy address"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
          {copied && <div className="text-green-400 text-xs mt-1">Copied!</div>}

          {contract.contractAddress && (
            <a
              href={`https://sepolia.starkscan.co/contract/${contract.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 mt-1 inline-flex items-center gap-1 hover:underline"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Source Code Info */}
        {hasSourceCode && (
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Code className="w-4 h-4" />
              <span>Source code available</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {contract.sourceCode!.split('\n').length} lines of code
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              Created {new Date(contract.createdAt).toLocaleDateString()}
            </span>
          </div>
          {contract.updatedAt && (
            <span>
              Updated {new Date(contract.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-700 px-6 py-4 bg-gray-800 bg-opacity-50">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewCode}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Details
          </button>
          
          {hasSourceCode && (
            <button
              onClick={onOpenEditor}
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              Open Editor
            </button>
          )}
          
          {type === "generated" && !contract.contractAddress && (
            <button className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm transition-colors">
              <ExternalLink className="w-4 h-4" />
              Deploy Contract
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={onDelete}
            disabled={deleteLoading}
            className={`flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors ${
              deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CodeModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const [activeCodeTab, setActiveCodeTab] = useState<"source" | "scarb">("source");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    const codeToCopy = activeCodeTab === "source" 
      ? contract.sourceCode || "" 
      : contract.scarbConfig || "";
    
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = codeToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{contract.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Code Tabs */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeCodeTab === "source"
                  ? "border-b-2 border-purple-500 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveCodeTab("source")}
            >
              Source Code
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeCodeTab === "scarb"
                  ? "border-b-2 border-purple-500 text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveCodeTab("scarb")}
            >
              Scarb.toml
            </button>
          </div>

          {/* Code Display */}
          <div className="relative">
            <button
              onClick={handleCopyCode}
              className={`absolute top-2 right-2 z-10 p-2 rounded ${
                copied ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
              } text-white text-xs transition-colors`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono">
              <code>
                {activeCodeTab === "source" 
                  ? contract.sourceCode || "No source code available" 
                  : contract.scarbConfig || "No Scarb configuration available"}
              </code>
            </pre>
          </div>

          {/* Contract Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Contract Info</h3>
              <div className="space-y-1 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-400">Created:</span> {new Date(contract.createdAt).toLocaleString()}
                </div>
                {contract.updatedAt && (
                  <div className="text-gray-300">
                    <span className="text-gray-400">Updated:</span> {new Date(contract.updatedAt).toLocaleString()}
                  </div>
                )}
                {contract.blockchain && (
                  <div className="text-gray-300">
                    <span className="text-gray-400">Blockchain:</span> {contract.blockchain}
                  </div>
                )}
              </div>
            </div>

            {contract.contractAddress && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Deployment Info</h3>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-300">
                    <span className="text-gray-400">Address:</span>
                    <div className="font-mono text-xs mt-1 break-all">
                      {contract.contractAddress}
                    </div>
                  </div>
                  <a
                    href={`https://sepolia.starkscan.co/contract/${contract.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    View on Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}