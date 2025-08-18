"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          StarkFinder
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl">
          The only platform you need for all things Starknet. Discover and interact with Starknet applications effortlessly.
        </p>
        <div className="space-x-4">
          <Link href="/chat">
            <Button size="lg" className="bg-[#171849] hover:bg-[#171849]/80">
              Start Chatting
            </Button>
          </Link>
          <Link href="/devx">
            <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Explore DevX
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
