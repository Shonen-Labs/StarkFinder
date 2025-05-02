import React from "react";
import { RefreshCw } from "lucide-react";
import { useAccount } from "@starknet-react/core";

export function LoadingScreen() {
    const { address } = useAccount()
    if (!address) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
                <div className="text-center max-w-md p-8 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20">
                    <div className="flex justify-center mb-6">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                    <h2 className="text-xl mb-4">Verifying Access</h2>
                    <p className="text-gray-400 mb-2">Please wait while we authenticate your credentials</p>
                    <div className="flex justify-center mt-6">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mx-1"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mx-1" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mx-1" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                </div>
            </div>
        );
    }

}