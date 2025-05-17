"use client";

import Link from "next/link";
import Accordion from "@/components/devx/contracts/Accordion";
import { useState, useEffect } from "react";
import { X, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes (for mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-white/10 rounded-md md:hidden"
        aria-label="Open menu"
      >
        <Menu className="text-white h-5 w-5" />
      </button>

      {/* Sidebar Backdrop (Mobile Only) */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#171849] text-white overflow-y-auto z-50 transition-transform duration-300 transform md:translate-x-0 md:z-10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 md:hidden"
          aria-label="Close menu"
        >
          <X className="text-white h-5 w-5" />
        </button>

        <div className="p-4 pt-12 md:pt-4">
          <Link href="/devx" className="block">
            <h1 className="text-3xl font-medium pb-4">DevXStark</h1>
          </Link>
          <Link href="/devx/contracts" className="block">
            <h1 className="text-lg font-medium pb-4">Introduction</h1>
          </Link>
        </div>
        <Accordion />
      </div>
    </>
  );
}
