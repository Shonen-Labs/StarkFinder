"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from 'next/navigation';
import { useParams } from "next/navigation";
import { Copy } from "lucide-react";

type Contract = {
  id: string;
  name: string;
  description?: string;
  contractAddress?: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'deployed' | 'verified';
  network?: string;
  gasUsed?: number;
  transactionHash?: string;
  sourceCode?: string;
  scarbConfig?: string;
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
  const [activeTab, setActiveTab] = useState<"deployed" | "generated">(
    "deployed"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const params = useParams();
  const router = useRouter();
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
      console.log('API Response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(response);
      // if (!response.ok) {
      //   throw new Error('Failed to fetch user data');
      // }
      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching user data');
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handle opening editor with contract code
  const handleOpenEditor = (contract: Contract) => {
    const editorUrl = new URL('/editor', window.location.origin);
    
    // Add contract data as URL parameters
    if (contract.sourceCode) {
      editorUrl.searchParams.set('code', encodeURIComponent(contract.sourceCode));
    }
    if (contract.scarbConfig) {
      editorUrl.searchParams.set('config', encodeURIComponent(contract.scarbConfig));
    }
    if (contract.name) {
      editorUrl.searchParams.set('name', contract.name);
    }
    if (contract.description) {
      editorUrl.searchParams.set('description', contract.description);
    }
    
    // Add contract ID for tracking deployment
    editorUrl.searchParams.set('contractId', contract.id);
    
    // Open in new tab
    window.open(editorUrl.toString(), '_blank');
  };

  // Handle contract deployment - remove from generated contracts when deployed
  const handleDeployContract = async (contract: Contract) => {
    try {
      // This would typically redirect to the editor with deployment mode
      const editorUrl = new URL('/editor', window.location.origin);
      
      // Add contract data as URL parameters
      if (contract.sourceCode) {
        editorUrl.searchParams.set('code', encodeURIComponent(contract.sourceCode));
      }
      if (contract.scarbConfig) {
        editorUrl.searchParams.set('config', encodeURIComponent(contract.scarbConfig));
      }
      if (contract.name) {
        editorUrl.searchParams.set('name', contract.name);
      }
      if (contract.description) {
        editorUrl.searchParams.set('description', contract.description);
      }
      
      // Add contract ID and deployment flag
      editorUrl.searchParams.set('contractId', contract.id);
      editorUrl.searchParams.set('deploy', 'true');
      
      // Open in new tab
      window.open(editorUrl.toString(), '_blank');
    } catch (error) {
      console.error('Error preparing contract for deployment:', error);
    }
  };

  // Remove contract from generated contracts when it's deployed
  const removeFromGeneratedContracts = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/generated/${contractId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove contract from generated list');
      }
      
      // Refresh user data to reflect changes
      await fetchUserData();
    } catch (error) {
      console.error('Error removing contract from generated list:', error);
    }
  };

  // Handle contract deployment success callback
  const handleDeploymentSuccess = async (contractId: string, deploymentData: any) => {
    try {
      // Move contract from generated to deployed
      const response = await fetch(`/api/contracts/move-to-deployed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          deploymentData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to move contract to deployed list');
      }
      
      // Refresh user data
      await fetchUserData();
    } catch (error) {
      console.error('Error moving contract to deployed list:', error);
    }
  };

  // Syntax highlighting for Cairo code
  const highlightCairoCode = (code: string) => {
    if (!code) return '';
    
    // Basic syntax highlighting for Cairo/Rust-like syntax
    return code
      .replace(/\b(mod|struct|enum|impl|trait|fn|let|mut|const|use|pub|contract|interface|storage|event|constructor|external|view|#\[.*?\])\b/g, '<span style="color: #569cd6;">$1</span>')
      .replace(/\b(u8|u16|u32|u64|u128|u256|felt252|bool|ContractAddress|ByteArray|Array|Span|Option|Result)\b/g, '<span style="color: #4ec9b0;">$1</span>')
      .replace(/\/\/.*$/gm, '<span style="color: #6a9955;">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a9955;">$&</span>')
      .replace(/"([^"\\]|\\.)*"/g, '<span style="color: #ce9178;">$&</span>')
      .replace(/\b\d+\b/g, '<span style="color: #b5cea8;">$&</span>');
  };

  // Copy code to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle contract selection for viewing code
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowCodeModal(true);
  };

  const getFilteredContracts = (contracts: Contract[]) => {
    let filtered = contracts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort contracts
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Not deployed yet';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-800 text-green-100';
      case 'verified':
        return 'bg-blue-800 text-blue-100';
      case 'draft':
        return 'bg-yellow-800 text-yellow-100';
      default:
        return 'bg-gray-800 text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white text-xl"
          >
            Loading profile...
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500 rounded-lg p-6"
          >
            <div className="text-red-400 text-xl mb-4">Error Loading Profile</div>
            <div className="text-red-300 text-sm mb-4">{error}</div>
            <button
              onClick={fetchUserData}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm transition-colors"
            >
              Retry
            </button>
          </motion.div>
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

  const currentContracts = activeTab === 'deployed' ? userData.deployedContracts : userData.generatedContracts;
  const filteredContracts = getFilteredContracts(currentContracts);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 p-2 w-24 h-24 flex items-center justify-center">
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
                <p className="text-purple-200 mb-2 text-sm font-mono bg-gray-700/50 rounded px-2 py-1 inline-block">
                  {formatAddress(userData.address)}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
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
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex border-b border-gray-700">
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'deployed'
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:text-gray-300'
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
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'generated'
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:text-gray-300'
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
        </motion.div>

        {/* Search and Sort Controls */}
        {currentContracts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contracts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredContracts.length > 0 ? (
            filteredContracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <ContractCard 
                  contract={contract} 
                  type={activeTab} 
                  onViewContract={handleViewContract}
                  onOpenEditor={handleOpenEditor}
                  onDeployContract={handleDeployContract}
                  onRemoveFromGenerated={removeFromGeneratedContracts}
                />
              </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "deployed" && userData.deployedContracts.length > 0 ? (
            userData.deployedContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                type="deployed"
              />
            ))
          ) : activeTab === "generated" &&
            userData.generatedContracts.length > 0 ? (
            userData.generatedContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                type="generated"
              />
            ))
          ) : (
            <div className="col-span-full text-center p-12">
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-xl font-medium text-white mb-2">
                  {searchTerm ? 'No matching contracts found' : `No ${activeTab} contracts found`}
                </h3>
                <p className="text-gray-300 mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : activeTab === 'deployed'
                    ? "You haven't deployed any contracts yet."
                    : "You haven't generated any contracts yet."}
                </p>
                {!searchTerm && (
                  <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors">
                    {activeTab === 'deployed'
                      ? "Deploy Your First Contract"
                      : "Generate Your First Contract"}
                  </button>
                )}
                <p className="text-gray-300">
                  {activeTab === "deployed"
                    ? "You haven't deployed any contracts yet."
                    : "You haven't generated any contracts yet."}
                </p>
                <button className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors">
                  {activeTab === "deployed"
                    ? "Deploy Your First Contract"
                    : "Generate Your First Contract"}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Code Modal */}
        {showCodeModal && selectedContract && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  {selectedContract.name} - Source Code
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEditor(selectedContract)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Editor
                  </button>
                  <button
                    onClick={() => setShowCodeModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="overflow-auto max-h-[calc(90vh-120px)]">
                {selectedContract.sourceCode && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Cairo Source Code</h3>
                      <button
                        onClick={() => copyToClipboard(selectedContract.sourceCode!)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-sm transition-colors"
                      >
                        Copy Code
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        <code 
                          dangerouslySetInnerHTML={{
                            __html: highlightCairoCode(selectedContract.sourceCode)
                          }}
                        />
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedContract.scarbConfig && (
                  <div className="p-6 border-t border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Scarb Configuration</h3>
                      <button
                        onClick={() => copyToClipboard(selectedContract.scarbConfig!)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors"
                      >
                        Copy Config
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        <code>{selectedContract.scarbConfig}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractCard({ contract, type, onViewContract, onOpenEditor, onDeployContract, onRemoveFromGenerated }: { 
  contract: Contract; 
  type: 'deployed' | 'generated';
  onViewContract: (contract: Contract) => void;
  onOpenEditor: (contract: Contract) => void;
  onDeployContract?: (contract: Contract) => void;
  onRemoveFromGenerated?: (contractId: string) => void;
}) {
  const formatAddress = (address: string) => {
    if (!address) return 'Not deployed yet';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-800 text-green-100';
      case 'verified':
        return 'bg-blue-800 text-blue-100';
      case 'draft':
        return 'bg-yellow-800 text-yellow-100';
      default:
        return 'bg-gray-800 text-gray-100';
    }
  };

  const hasSourceCode = contract.sourceCode && contract.sourceCode.trim().length > 0;
  const hasScarbConfig = contract.scarbConfig && contract.scarbConfig.trim().length > 0;
  const hasCode = hasSourceCode || hasScarbConfig;

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
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-white truncate pr-2" title={contract.name}>
            {contract.name}
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs shrink-0 ${
              contract.status 
                ? getStatusColor(contract.status)
                : type === 'deployed' 
                ? 'bg-green-800 text-green-100' 
                : 'bg-blue-800 text-blue-100'
            }`}
          >
            {contract.status || (type === 'deployed' ? 'Deployed' : 'Generated')}
          </span>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3" title={contract.description}>
          {contract.description || 'No description provided'}
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Contract Address</div>
            <div className="bg-gray-700/50 p-2 rounded text-xs text-gray-200 font-mono">
              {formatAddress(contract.address || '')}
            </div>
          </div>

          {contract.network && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Network</div>
              <div className="text-xs text-purple-300 capitalize">
                {contract.network}
              </div>
            </div>
          )}

          {contract.gasUsed && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Gas Used</div>
              <div className="text-xs text-green-300">
                {contract.gasUsed.toLocaleString()}
              </div>
            </div>
          )}

          {hasCode && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Available Files</div>
              <div className="flex flex-wrap gap-1">
                {hasSourceCode && (
                  <span className="px-2 py-1 bg-blue-800/50 text-blue-200 text-xs rounded">
                    Cairo Source
                  </span>
                )}
                {hasScarbConfig && (
                  <span className="px-2 py-1 bg-purple-800/50 text-purple-200 text-xs rounded">
                    Scarb Config
                  </span>
                )}
              </div>
            </div>
          <h3 className="font-bold text-lg text-white truncate">
            {contract.name}
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs ${
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
          <div className="text-xs text-gray-400 mb-1">Contract Address</div>
          <div className="bg-gray-700 p-2 rounded text-xs text-gray-200 font-mono flex items-center justify-between gap-2">
            <span className="truncate">
              {contract.contractAddress || "Not deployed yet"}
            </span>

            {contract.contractAddress && (
              <button
                onClick={handleCopy}
                className={`${copied ? "text-green-600" : "text-gray-400"} hover:text-white transition`}
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

      <div className="border-t border-gray-700 px-6 py-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => onViewContract(contract)}
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              disabled={!hasCode}
            >
              {hasCode ? 'View Code' : 'View Details'}
            </button>
            
            {hasCode && (
              <button
                onClick={() => onOpenEditor(contract)}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Editor
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {type === 'generated' && !contract.address && (
              <>
                <button 
                  onClick={() => onDeployContract && onDeployContract(contract)}
                  className="text-green-400 hover:text-green-300 text-sm transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Deploy
                </button>
                <button 
                  onClick={() => onRemoveFromGenerated && onRemoveFromGenerated(contract.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors flex items-center gap-1"
                  title="Remove from generated contracts"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </>
            )}
            {contract.address && (
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                View Explorer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
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
    </div>
  );
}
