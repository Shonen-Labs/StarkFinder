"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DevXNavbar } from "@/components/profile/DevXNavbar";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { SidebarOption, UserData } from "@/types/profile";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeOption, setActiveOption] = useState<SidebarOption>('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      {/* DevX Navbar */}
      <DevXNavbar 
        isWalletModalOpen={isWalletModalOpen}
        setIsWalletModalOpen={setIsWalletModalOpen}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <ProfileSidebar
          userData={userData}
          activeOption={activeOption}
          setActiveOption={setActiveOption}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <ProfileContent
              userData={userData}
              activeOption={activeOption}
              userId={id as string}
              isEditModalOpen={isEditModalOpen}
              setIsEditModalOpen={setIsEditModalOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
