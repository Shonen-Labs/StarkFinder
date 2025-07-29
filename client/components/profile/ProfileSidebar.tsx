"use client";

import React from "react";
import { 
  User, Settings, Edit3, FileText, Code, ChevronRight, 
  Shield, Zap, TrendingUp, Database, X
} from "lucide-react";
import { SidebarOption, UserData } from "@/types/profile";

interface ProfileSidebarProps {
  userData: UserData;
  activeOption: SidebarOption;
  setActiveOption: (option: SidebarOption) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function ProfileSidebar({ 
  userData, 
  activeOption, 
  setActiveOption, 
  sidebarOpen, 
  setSidebarOpen 
}: ProfileSidebarProps) {
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
    <>
      {/* Desktop Sidebar */}
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
    </>
  );
} 