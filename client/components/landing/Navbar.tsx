/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquarePlus, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const slideRight = {
  initial: {
    y: "100vh",
  },
  enter: {
    y: "0",
    transition: {
      duration: 1,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  exit: {
    y: "100vh",
    transition: {
      duration: 1,
    },
  },
};

const MenuItem = ({
  children,
  href,
  isActive,
}: {
  children: React.ReactNode;
  href: string;
  isActive: boolean;
}) => {
  return (
    <Link href={href}>
      <motion.li
        className={cn(
          "relative cursor-pointer text-white px-4 py-2 rounded-full transition-colors",
          isActive
            ? "bg-white bg-opacity-20"
            : "hover:bg-white hover:bg-opacity-10"
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
    <div className="relative w-full bg-gradient-to-b from-black via-gray-900 to-black py-8">
      <Navbar />
    </div>
  );
}

const ChatModal = ({
  showPopup,
  setShowPopup,
}: {
  setShowPopup: (val: boolean) => void;
  showPopup: boolean;
}) => {
  const router = useRouter();

  const createNewChat = async () => {
    const id = uuidv4();
    router.push(`/agent/chat/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    router.push(`/agent/transaction/${id}`);
  };

  return (
    <AnimatePresence mode="wait">
      {showPopup && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPopup(false)}
        >
          <motion.div
            variants={slideRight}
            initial="initial"
            animate={showPopup ? "enter" : "exit"}
            exit={"exit"}
            className="bg-white relative rounded-lg p-6 shadow-xl max-w-[350px] w-full lg:w-[350px] min-h-[530px] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold my-4 text-start text-[#000]">
              Choose an option
              <span className="block text-sm font-normal">
                Explore your different options in getting started with
                StarkFinder
              </span>
            </h2>
            <div className="space-y-4">
              <Button
                onClick={createNewChat}
                className="w-full bg-blue-900 hover:bg-slate-700 text-white rounded-full font-normal min-h-[60px] cursor-pointer flex items-center justify-center gap-4 px-8 py-3 duration-200 text-base"
              >
                <MessageSquarePlus size={20} />
                <span>New Chat</span>
              </Button>
              <Button
                onClick={createNewTxn}
                className="w-full bg-white hover:bg-[#eee] shadow-none border text-[#000] rounded-full font-normal min-h-[60px] cursor-pointer flex items-center justify-center gap-4 px-8 py-3 duration-200 text-base"
              >
                <CreditCard size={20} />
                <span>New Transaction</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function Navbar() {
  const [active, setActive] = useState("home");
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <div className="w-full px-6 md:w-[90%] max-w-[1000px] mx-auto border border-[rgba(255,255,255,.2)] rounded-full bg-gradient-to-b from-black via-gray-900 to-black py-4 min-h-[55px] flex items-center justify-between">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href={"/"}
            className="text-lg lg:text-2xl text-[#fff] font-bold"
          >
            StarkFinder
          </Link>
        </div>
        <div className="hidden lg:flex flex-1 justify-center items-center gap-12">
          <Link
            href={"#"}
            className="text-base hover:bg-[rgba(255,255,255,.06)] hover:text-[#fff] p-3 rounded-full text-[#fff] font-normal"
          >
            Features
          </Link>
          <Link
            href={"#"}
            className="text-base hover:bg-[rgba(255,255,255,.06)] hover:text-[#fff] p-3 rounded-full text-[#fff] font-normal"
          >
            App
          </Link>
          <Link
            href={"#"}
            className="text-base hover:bg-[rgba(255,255,255,.06)] hover:text-[#fff] p-3 rounded-full text-[#fff] font-normal"
          >
            Pricing
          </Link>
          <Link
            href={"#"}
            className="text-base hover:bg-[rgba(255,255,255,.06)] hover:text-[#fff] p-3 rounded-full text-[#fff] font-normal"
          >
            Integration
          </Link>
        </div>
        <div className="flex items-center justify-end gap-8 md:gap-12">
          <Button
            onClick={() => setShowPopup(true)}
            className="bg-white text-black min-h-[55px] cursor-pointer flex items-center justify-center gap-4 px-8 py-3 rounded-full hover:bg-[#eeee]"
          >
            <LogOut size={16} />
            <span>Launch App</span>
          </Button>
        </div>
      </div>
      <ChatModal showPopup={showPopup} setShowPopup={setShowPopup} />
    </>
    // <>
    //   <motion.nav
    //     initial={{ y: -100, opacity: 0 }}
    //     animate={{ y: 0, opacity: 1 }}
    //     transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
    //     className={cn(
    //       "fixed top-4 inset-x-0 max-w-3xl mx-auto z-50 rounded-full border border-white/[0.2] bg-black bg-opacity-50 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md",
    //       className
    //     )}
    //   >
    //     <ul className="flex justify-center items-center py-3">
    //       <div className="flex items-center space-x-4 px-10">
    //         <MenuItem href="/" isActive={active === "home"}>Home</MenuItem>
    //         {/* Add more menu items here */}
    //       </div>
    // <Button
    //   onClick={() => setShowPopup(true)}
    //   className="bg-white text-black hover:bg-opacity-90 transition-all duration-200 ease-in-out rounded-full px-4 py-2 flex items-center space-x-2"
    // >
    //   <LogOut size={16} />
    //   <span>Launch App</span>
    // </Button>
    //     </ul>
    //   </motion.nav>

    // <AnimatePresence>
    //   {showPopup && (
    //     <motion.div
    //       initial={{ opacity: 0, scale: 0.9 }}
    //       animate={{ opacity: 1, scale: 1 }}
    //       exit={{ opacity: 0, scale: 0.9 }}
    //       transition={{ duration: 0.2 }}
    //       className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    //       onClick={() => setShowPopup(false)}
    //     >
    //       <motion.div
    //         className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full"
    //         onClick={(e) => e.stopPropagation()}
    //       >
    //         <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Choose an option</h2>
    //         <div className="space-y-4">
    //           <Button
    //             onClick={createNewChat}
    //             className="w-full bg-slate-900 hover:bg-blue-700 text-white rounded-full py-3 flex items-center justify-center space-x-2 transition-colors duration-200"
    //           >
    //             <MessageSquarePlus size={20} />
    //             <span>New Chat</span>
    //           </Button>
    //           <Button
    //             onClick={createNewTxn}
    //             className="w-full bg-green-800 hover:bg-green-700 text-white rounded-full py-3 flex items-center justify-center space-x-2 transition-colors duration-200"
    //           >
    //             <CreditCard size={20} />
    //             <span>New Transaction</span>
    //           </Button>
    //         </div>
    //       </motion.div>
    //     </motion.div>
    //   )}
    // </AnimatePresence>
    // </>
  );
}

export default Navbar;
