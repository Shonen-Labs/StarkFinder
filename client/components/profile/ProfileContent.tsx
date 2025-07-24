"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  User, Settings, Edit3, FileText, Code, Plus, 
  Shield, TrendingUp, Database, Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CachedContractsManager } from '@/components/cached-contracts/CachedContractsManager';
import { ContractCard } from './ContractCard';
import { SidebarOption, UserData } from "@/types/profile";
import Link from "next/link";

interface ProfileContentProps {
  userData: UserData;
  activeOption: SidebarOption;
  userId: string;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
}

export function ProfileContent({ 
  userData, 
  activeOption, 
  userId,
  isEditModalOpen,
  setIsEditModalOpen
}: ProfileContentProps) {
  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      {/* Content based on active option */}
      {activeOption === 'details' && (
        <div className="space-y-6">
          <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-8 shadow-xl border border-gray-700">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <User className="text-purple-400" size={32} />
              Profile Details
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-xl">
                  <User className="text-purple-400" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Email Address</p>
                    <p className="text-white font-medium">{userData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-xl">
                  <User className="text-purple-400" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Wallet Address</p>
                    <p className="text-white font-mono text-sm">
                      {userData.address ? formatAddress(userData.address) : "Not connected"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-xl">
                  <User className="text-purple-400" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Member Since</p>
                    <p className="text-white font-medium">
                      {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-900 to-blue-900 bg-opacity-50 rounded-xl p-6">
                  <h3 className="text-purple-200 font-semibold mb-4 flex items-center gap-2">
                    <Activity size={20} />
                    Activity Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Deployed Contracts</span>
                      <span className="text-white font-bold text-lg">{userData.deployedContracts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Generated Contracts</span>
                      <span className="text-white font-bold text-lg">{userData.generatedContracts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Value</span>
                      <span className="text-green-400 font-bold">$12,450</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 bg-opacity-50 rounded-xl p-6">
                  <h3 className="text-indigo-200 font-semibold mb-4 flex items-center gap-2">
                    <Zap size={20} />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {/* Handle edit */}}
                      className="w-full text-left text-indigo-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-indigo-800 hover:bg-opacity-50"
                    >
                      ✏️ Edit Profile
                    </button>
                    <Link href="/devx">
                      <div className="w-full text-left text-indigo-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-indigo-800 hover:bg-opacity-50">
                        📄 View Generated Contracts
                      </div>
                    </Link>
                    <Link href="/deploy">
                      <div className="w-full text-left text-indigo-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-indigo-800 hover:bg-opacity-50">
                        🚀 View Deployed Contracts
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeOption === 'generated' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="text-green-400" size={32} />
              Generated Contracts
            </h1>
            <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Plus size={16} />
              Generate New
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userData.generatedContracts.length > 0 ? (
              userData.generatedContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  type="generated"
                />
              ))
            ) : (
              <div className="col-span-full">
                <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-12 text-center border border-gray-700">
                  <FileText className="text-gray-400 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-medium text-white mb-2">
                    No generated contracts found
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Start building by generating your first smart contract.
                  </p>
                  <Link href="/devx">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Generate Your First Contract
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeOption === 'deployed' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Code className="text-purple-400" size={32} />
              Deployed Contracts
            </h1>
            <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
              <Plus size={16} />
              Deploy New
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userData.deployedContracts.length > 0 ? (
              userData.deployedContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  type="deployed"
                />
              ))
            ) : (
              <div className="col-span-full">
                <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-12 text-center border border-gray-700">
                  <Code className="text-gray-400 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-medium text-white mb-2">
                    No deployed contracts found
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Deploy your first smart contract to get started.
                  </p>
                  <Link href="/deploy">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Deploy Your First Contract
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeOption === 'cached' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-orange-400" size={32} />
            Cached Contracts
          </h1>
          <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-6 border border-gray-700">
            <CachedContractsManager userId={userId} />
          </div>
        </div>
      )}

      {activeOption === 'analytics' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-pink-400" size={32} />
            Analytics Dashboard
          </h1>
          <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-300 text-center">
              Analytics dashboard coming soon! 📊
            </p>
          </div>
        </div>
      )}

      {activeOption === 'edit' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Edit3 className="text-yellow-400" size={32} />
            Edit Profile
          </h1>
          <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-300 text-center mb-6">
              Profile editing functionality will be implemented here.
            </p>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Edit Profile (Coming Soon)
            </Button>
          </div>
        </div>
      )}

      {activeOption === 'security' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-red-400" size={32} />
            Security Settings
          </h1>
          <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-300 text-center">
              Security settings coming soon! 🔒
            </p>
          </div>
        </div>
      )}

      {activeOption === 'settings' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="text-gray-400" size={32} />
            Settings
          </h1>
          <div className="bg-gray-800 bg-opacity-70 rounded-2xl p-8 border border-gray-700">
            <div className="space-y-4">
              <Button className="bg-indigo-600 hover:bg-indigo-700 mr-4">
                Connect Wallet
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Profile editing functionality is coming soon!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 