"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthHeaderProps {
  isLogin: boolean;
  onToggleMode: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

// Placeholder icon component
function StarkFinderIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center",
        className
      )}
    >
      <span className="text-white font-bold text-xl">SF</span>
    </div>
  );
}

export function AuthHeader({
  isLogin,
  onToggleMode,
  showBackButton = true,
  onBack,
}: AuthHeaderProps) {
  return (
    <div className="space-y-8 pb-8">
      {showBackButton && (
        <motion.div
          className="absolute top-6 left-6 z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <motion.button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* Logo/Brand */}
      <Link href="/">
        <motion.div
          className="flex justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StarkFinderIcon className="w-16 h-16" />
        </motion.div>
      </Link>

      {/* Tab Switcher */}
      <motion.div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-800">
        <motion.button
          onClick={() => !isLogin && onToggleMode()}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative",
            isLogin ? "text-black" : "text-gray-400 hover:text-white"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLogin && (
            <motion.div
              className="absolute inset-0 bg-white rounded-md shadow-sm"
              layoutId="activeTab"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Sign In</span>
        </motion.button>
        <motion.button
          onClick={() => isLogin && onToggleMode()}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative",
            !isLogin ? "text-black" : "text-gray-400 hover:text-white"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {!isLogin && (
            <motion.div
              className="absolute inset-0 bg-white rounded-md shadow-sm"
              layoutId="activeTab"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Sign Up</span>
        </motion.button>
      </motion.div>

      <motion.div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-gray-400 mt-2">
              {isLogin
                ? "Sign in to your StarkFinder account"
                : "Join StarkFinder and start exploring"}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
