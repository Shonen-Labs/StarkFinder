"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { 
  Copy, User, Settings, Edit3, FileText, Code, Home, Book, Wallet, LogOut, 
  Menu, X, ChevronRight, ExternalLink, Calendar, Mail, MapPin, Plus, 
  Activity, Shield, Zap, Star, TrendingUp, Users, Database, Globe
} from "lucide-react";
import { CachedContractsManager } from '@/components/cached-contracts/CachedContractsManager';
import { useSession, signOut } from "next-auth/react";
import { useAccount, useConnect } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

type Contract = {
  id: string;
  name: string;
  description?: string;
  contractAddress?: string;
  createdAt: string;
  updatedAt?: string;
};

type UserData = {
  name: string;
  email: string;
  address?: string;
  createdAt: string;
  deployedContracts: Contract[];
  generatedContracts: Contract[];
};

type SidebarOption = 'details' | 'generated' | 'deployed' | 'cached' | 'edit' | 'settings' | 'analytics' | 'security';

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeOption, setActiveOption] = useState<SidebarOption>('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { data: session } = useSession();
  const { address } = useAccount();
  const { connect, connectors } = useConnect();

  const fetchUserData = useCallback(async () => {
    if (!id) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/user/${id}`);
      console.log(response);
      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [id, fetchUserData]);

  const handleConnect = async (connectorId: string) => {
    try {
      await connect({
        connector: connectors.find((c) => c.id === connectorId),
      });
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-white text-xl">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button
              onClick={fetchUserData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const sidebarOptions = [
    { id: 'details' as SidebarOption, label: 'Profile Details', icon: User, color: 'text-blue-400' },
    { id: 'generated' as SidebarOption, label: 'Generated Contracts', icon: FileText, color: 'text-green-400' },
    { id: 'deployed' as SidebarOption, label: 'Deployed Contracts', icon: Code, color: 'text-purple-400' },
    { id: 'cached' as SidebarOption, label: 'Cached Contracts', icon: Database, color: 'text-orange-400' },
    { id: 'analytics' as SidebarOption, label: 'Analytics', icon: TrendingUp, color: 'text-pink-400' },
    { id: 'edit' as SidebarOption, label: 'Edit Profile', icon: Edit3, color: 'text-yellow-400' },
    { id: 'security' as SidebarOption, label: 'Security', icon: Shield, color: 'text-red-400' },
    { id: 'settings' as SidebarOption, label: 'Settings', icon: Settings, color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      {/* DevX Navbar */}
      <header className="bg-[radial-gradient(circle,_#797474,_#e6e1e1,_#979191)] animate-smoke text-white w-full shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center h-16">
          <div className="flex items-center">
            <Link href="/devx">
              <h2 className="text-md md:text-2xl font-semibold text-black cursor-pointer">
                DevXStark
              </h2>
            </Link>
          </div>
          
          <div className="flex-1" />
          
          <div className="hidden md:flex items-center gap-4 justify-end">
            <Link
              href="/"
              className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
            >
              <Home size={18} /> Home
            </Link>
            <Link
              href="/devx/resources"
              className="flex items-center gap-2 hover:text-black transition-colors hover:scale-110 duration-300"
            >
              <Book size={18} /> Resources
            </Link>
            {!address && (
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-primary hover:bg-primary-dark h-8"
              >
                <Wallet size={16} /> Connect Wallet
              </Button>
            )}
            {session && (
              <Button
                onClick={handleLogout}
                className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-red-600 hover:bg-red-700 h-8"
              >
                <LogOut size={16} /> Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-black hover:text-gray-700"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {sidebarOpen && (
          <div className="md:hidden bg-white p-4 rounded-lg shadow-lg mx-4 mb-4">
            <ul className="flex flex-col text-black gap-4">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <Home size={18} /> Home
                </Link>
              </li>
              <li>
                <Link
                  href="/devx/resources"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <Book size={18} /> Resources
                </Link>
              </li>
              {!address && (
                <li>
                  <Button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-primary hover:bg-primary-dark h-8"
                  >
                    <Wallet size={16} /> Connect Wallet
                  </Button>
                </li>
              )}
              {session && (
                <li>
                  <Button
                    onClick={handleLogout}
                    className="flex items-center gap-2 hover:scale-110 duration-300 text-xs md:text-sm bg-red-600 hover:bg-red-700 h-8"
                  >
                    <LogOut size={16} /> Logout
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="hidden md:block w-80 bg-gray-800 bg-opacity-50 backdrop-blur-sm border-r border-gray-700 overflow-y-auto">
          <div className="p-6">
            {/* User Profile Header */}
            <div className="mb-8 text-center">
              <div className="relative mx-auto mb-4">
                <div className="rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 w-24 h-24">
                  <div className="rounded-full bg-gray-800 p-2 w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {userData.name || "Anonymous User"}
              </h2>
              <p className="text-purple-200 text-sm mb-3">{userData.email}</p>
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-purple-900 bg-opacity-50 rounded-full text-xs text-purple-200">
                  {userData.deployedContracts.length} Deployed
                </span>
                <span className="px-3 py-1 bg-green-900 bg-opacity-50 rounded-full text-xs text-green-200">
                  {userData.generatedContracts.length} Generated
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sidebarOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveOption(option.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      activeOption === option.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Icon size={20} className={activeOption === option.id ? "text-white" : option.color} />
                    <span className="font-medium">{option.label}</span>
                    <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gray-700 bg-opacity-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total Contracts</span>
                  <span className="text-white font-medium">
                    {userData.deployedContracts.length + userData.generatedContracts.length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400 font-medium">98%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white font-medium">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
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
                        <Mail className="text-purple-400" size={24} />
                        <div>
                          <p className="text-gray-400 text-sm">Email Address</p>
                          <p className="text-white font-medium">{userData.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-xl">
                        <MapPin className="text-purple-400" size={24} />
                        <div>
                          <p className="text-gray-400 text-sm">Wallet Address</p>
                          <p className="text-white font-mono text-sm">
                            {userData.address ? formatAddress(userData.address) : "Not connected"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-xl">
                        <Calendar className="text-purple-400" size={24} />
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
                            onClick={() => setActiveOption('edit')}
                            className="w-full text-left text-indigo-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-indigo-800 hover:bg-opacity-50"
                          >
                            ✏️ Edit Profile
                          </button>
                          <button
                            onClick={() => setActiveOption('generated')}
                            className="w-full text-left text-indigo-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-indigo-800 hover:bg-opacity-50"
                          >
                            📄 View Generated Contracts
                          </button>
                          <button
                            onClick={() => setActiveOption('deployed')}
                            className="w-full text-left text-indigo-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-indigo-800 hover:bg-opacity-50"
                          >
                            🚀 View Deployed Contracts
                          </button>
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
                  <CachedContractsManager userId={id as string} />
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
                    <Button
                      onClick={() => setIsWalletModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 mr-4"
                    >
                      Connect Wallet
                    </Button>
                    <Button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-gray-800 bg-opacity-95 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-8 text-center">
              <div className="rounded-full bg-purple-700 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">
                {userData.name || "Anonymous User"}
              </h3>
              <p className="text-purple-200 text-sm text-center">{userData.email}</p>
            </div>

            <nav className="space-y-2">
              {sidebarOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setActiveOption(option.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeOption === option.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{option.label}</span>
                    <ChevronRight size={16} className="ml-auto" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Wallet Connection Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Connect {connector.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

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
