"use client";
import Sidebar from "@/components/devx/contracts/Sidebar";
import { motion } from "framer-motion";

export default function ERC721() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Sidebar />
      </motion.div>
    </div>
  );
}
