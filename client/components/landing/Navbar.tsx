/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquarePlus, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

const MenuItem = ({ children, href, isActive }: { children: React.ReactNode; href: string; isActive: boolean }) => {
  return (
    <Link href={href}>
      <motion.li
        className={cn(
          "relative cursor-pointer text-white px-4 py-2 rounded-full transition-colors",
          isActive ? "bg-white bg-opacity-20" : "hover:bg-white hover:bg-opacity-10"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10">{children}</span>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-white bg-opacity-20 rounded-full"
            layoutId="active-bg"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </motion.li>
    </Link>
  );
};

export function NavbarDemo() {
  return (
    <div className="relative w-full flex items-center justify-center pb-28">
      <Navbar className="top-2" />
    </div>
  );
}

function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState("home");
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  const createNewChat = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    await router.push(`/agent/transaction/${id}`);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        className={cn(
          "fixed top-4 inset-x-0 max-w-3xl mx-auto z-50 rounded-full border border-white/[0.2] bg-black bg-opacity-50 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md",
          className
        )}
      >
        <ul className="flex justify-center items-center py-3">
          <div className="flex items-center space-x-4 px-10">
            <MenuItem href="/" isActive={active === "home"}>Home</MenuItem>
            {/* Add more menu items here */}
          </div>
          <Button
            onClick={() => setShowPopup(true)}
            className="bg-white text-black hover:bg-opacity-90 transition-all duration-200 ease-in-out rounded-full px-4 py-2 flex items-center space-x-2"
          >
            <LogOut size={16} />
            <span>Launch App</span>
          </Button>
        </ul>
      </motion.nav>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Choose an option</h2>
              <div className="space-y-4">
                <Button
                  onClick={createNewChat}
                  className="w-full bg-slate-900 hover:bg-blue-700 text-white rounded-full py-3 flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <MessageSquarePlus size={20} />
                  <span>New Chat</span>
                </Button>
                <Button
                  onClick={createNewTxn}
                  className="w-full bg-green-800 hover:bg-green-700 text-white rounded-full py-3 flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  <CreditCard size={20} />
                  <span>New Transaction</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;