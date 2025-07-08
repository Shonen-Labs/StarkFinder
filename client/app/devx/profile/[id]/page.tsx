'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from "framer-motion";
import { useParams, useRouter } from 'next/navigation';
import { Eye, Code, ExternalLink, Calendar, MapPin, Hash, AlertCircle, CheckCircle } from 'lucide-react';

type Contract = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  code?: string; // Contract source code
  abi?: string; // Contract ABI
  bytecode?: string; // Contract bytecode
  language?: string; // Solidity version or language
  status?: 'draft' | 'compiled' | 'deployed' | 'verified';
  tags?: string[]; // Contract tags/categories
  network?: string; // Deployment network
  gasUsed?: number; // Gas used for deployment
  transactionHash?: string; // Deployment transaction hash
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
  const [activeTab, setActiveTab] = useState<'deployed' | 'generated'>('deployed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployingContract, setDeployingContract] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const fetchUserData = useCallback(async () => {
    if (!id) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/user/${id}`);
      console.log(response);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleOpenEditor = useCallback((contract: Contract) => {
    // Navigate to editor with contract data
    const editorUrl = `/editor?contractId=${contract.id}&source=profile`;
    router.push(editorUrl);
  }, [router]);

  const handleDeployContract = useCallback(async (contract: Contract) => {
    if (!contract.code || !contract.bytecode) {
      alert('Contract code or bytecode is missing. Please compile the contract first.');
      return;
    }

    setDeployingContract(contract.id);
    
    try {
      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contract.id,
          userId: id,
          code: contract.code,
          bytecode: contract.bytecode,
          abi: contract.abi,
          name: contract.name,
          description: contract.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy contract');
      }

      const deployResult = await response.json();
      
      // Remove from generated contracts and add to deployed contracts
      if (userData) {
        const updatedGeneratedContracts = userData.generatedContracts.filter(c => c.id !== contract.id);
        const deployedContract = {
          ...contract,
          address: deployResult.address,
          transactionHash: deployResult.transactionHash,
          status: 'deployed' as const,
          updatedAt: new Date().toISOString(),
        };
        
        setUserData({
          ...userData,
          generatedContracts: updatedGeneratedContracts,
          deployedContracts: [...userData.deployedContracts, deployedContract],
        });
      }
      
      alert('Contract deployed successfully!');
    } catch (err) {
      console.error('Deployment error:', err);
      alert(err instanceof Error ? err.message : 'Failed to deploy contract');
    } finally {
      setDeployingContract(null);
    }
  }, [id, userData]);

  const handleViewContract = useCallback((contract: Contract) => {
    // Navigate to contract details page
    const detailsUrl = `/contracts/${contract.id}`;
    router.push(detailsUrl);
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [id, fetchUserData]);

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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r text-white bg-clip-text text-transparent mb-4">
          User Profile
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          View and manage your activity—deployed contracts, generated templates, and on-chain contributions in one place.
        </p>
      </motion.div>
      
      <div className="max-w-7xl mx-auto">
        {/* User Profile Header */}
        <div className="bg-gray-800 bg-opacity-70 rounded-lg shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="rounded-full bg-purple-700 p-2 w-24 h-24 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white mb-2">
                {userData.name || 'Anonymous User'}
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
                  Member since {new Date(userData.createdAt).toLocaleDateString()}
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
                activeTab === 'deployed'
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('deployed')}
            >
              Deployed Contracts ({userData.deployedContracts.length})
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'generated'
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('generated')}
            >
              Generated Contracts ({userData.generatedContracts.length})
            </button>
          </div>
        </div>

        {/* Contracts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'deployed' && userData.deployedContracts.length > 0 ? (
            userData.deployedContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                type="deployed"
                onOpenEditor={handleOpenEditor}
                onViewContract={handleViewContract}
                onDeployContract={handleDeployContract}
                isDeploying={deployingContract === contract.id}
              />
            ))
          ) : activeTab === 'generated' && userData.generatedContracts.length > 0 ? (
            userData.generatedContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                type="generated"
                onOpenEditor={handleOpenEditor}
                onViewContract={handleViewContract}
                onDeployContract={handleDeployContract}
                isDeploying={deployingContract === contract.id}
              />
            ))
          ) : (
            <div className="col-span-full text-center p-12">
              <div className="bg-gray-800 bg-opacity-70 rounded-lg p-8">
                <h3 className="text-xl font-medium text-white mb-2">
                  No {activeTab} contracts found
                </h3>
                <p className="text-gray-300">
                  {activeTab === 'deployed'
                    ? "You haven't deployed any contracts yet."
                    : "You haven't generated any contracts yet."}
                </p>
                <button 
                  onClick={() => router.push('/generator')}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
                >
                  {activeTab === 'deployed'
                    ? "Deploy Your First Contract"
                    : "Generate Your First Contract"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContractCard({ 
  contract, 
  type, 
  onOpenEditor, 
  onViewContract, 
  onDeployContract, 
  isDeploying 
}: { 
  contract: Contract; 
  type: 'deployed' | 'generated';
  onOpenEditor: (contract: Contract) => void;
  onViewContract: (contract: Contract) => void;
  onDeployContract: (contract: Contract) => void;
  isDeploying: boolean;
}) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-800 text-green-100';
      case 'compiled':
        return 'bg-blue-800 text-blue-100';
      case 'draft':
        return 'bg-yellow-800 text-yellow-100';
      case 'verified':
        return 'bg-purple-800 text-purple-100';
      default:
        return 'bg-gray-800 text-gray-100';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'deployed':
      case 'verified':
        return <CheckCircle className="w-3 h-3" />;
      case 'draft':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 bg-opacity-70 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-opacity-80">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-white truncate pr-2">{contract.name}</h3>
          <div className="flex gap-2">
            <span
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                type === 'deployed' ? 'bg-green-800 text-green-100' : 'bg-blue-800 text-blue-100'
              }`}
            >
              {getStatusIcon(contract.status)}
              {type === 'deployed' ? 'Deployed' : 'Generated'}
            </span>
            {contract.status && contract.status !== (type === 'deployed' ? 'deployed' : 'draft') && (
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contract.status)}`}>
                {contract.status}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {contract.description || 'No description provided'}
        </p>

        {/* Contract Details */}
        <div className="space-y-3 mb-4">
          {contract.address && (
            <div>
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Contract Address
              </div>
              <div className="bg-gray-700 p-2 rounded text-xs text-gray-200 font-mono truncate">
                {contract.address}
              </div>
            </div>
          )}

          {contract.transactionHash && (
            <div>
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Transaction Hash
              </div>
              <div className="bg-gray-700 p-2 rounded text-xs text-gray-200 font-mono truncate">
                {contract.transactionHash}
              </div>
            </div>
          )}

          {contract.network && (
            <div className="text-xs text-gray-400">
              Network: <span className="text-gray-200">{contract.network}</span>
            </div>
          )}

          {contract.language && (
            <div className="text-xs text-gray-400">
              Language: <span className="text-gray-200">{contract.language}</span>
            </div>
          )}

          {contract.gasUsed && (
            <div className="text-xs text-gray-400">
              Gas Used: <span className="text-gray-200">{contract.gasUsed.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contract.tags && contract.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {contract.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(contract.createdAt).toLocaleDateString()}
          </span>
          {contract.updatedAt && (
            <span>Updated {new Date(contract.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => onViewContract(contract)}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <button 
            onClick={() => onOpenEditor(contract)}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors flex items-center gap-1"
          >
            <Code className="w-4 h-4" />
            Open Editor
          </button>
        </div>
        
        {type === 'generated' && !contract.address && (
          <button 
            onClick={() => onDeployContract(contract)}
            disabled={isDeploying}
            className="text-green-400 hover:text-green-300 text-sm transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </button>
        )}
      </div>
    </div>
  );
}