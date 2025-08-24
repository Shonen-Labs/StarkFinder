"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRightIcon, Moon, Sun } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { div } from "framer-motion/client";
import { WalletOptions } from "../WalletButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/about", label: "About" },
  { href: "/docs", label: "Docs" },
];

export const Nav = () => {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <header className="w-full sticky top-0 lg:pt-5 mx-auto  z-50 max-w-7xl">
      <nav className="flex justify-between px-8 py-3 items-center max-w-7xl mx-auto bg-white lg:rounded-md dark:bg-bl">
        {/* Logo */}
        <div>
          <h2
            aria-label="anon logo"
            className="font-bold text-xl tracking-tight dark:text-black text-black"
          >
            anon
          </h2>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex gap-8">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;

            return (
              <li key={href} className="relative">
                <Link
                  href={href}
                  className="font-medium text-gray-700 dark:text-gray-600 hover:text-black dark:hover:text-white transition-colors"
                >
                  {label}
                </Link>

                {isActive && (
                  <motion.div
                    layoutId="underline"
                    className="h-0.5 bg-black dark:bg-gray-600 rounded-full absolute left-0 right-0 bottom-0 mx-auto w-full"
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Actions (Login + Theme Toggle) */}
        <div className="flex items-center gap-3">
          {/* <Button className="px-5 py-2 rounded-full bg-black  text-white font-medium hover:bg-gray-900 transition dark:bg-black dark:text-white dark:hover:bg-gray-200">
            Login
          </Button> */}

          <WalletOptions />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition hidden md:inline-flex"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Mobile Menu Button  */}
          <button
            role="menu"
            aria-label="menu button"
            className="flex flex-col md:hidden gap-1  rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition  w-6"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <motion.div
              initial={{ rotate: 0, y: 0 }}
              animate={isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className=" w-full h-0.5 bg-gray-900 origin-center"
            />
            <motion.div
              initial={{ opacity: 1 }}
              animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
              className=" w-full h-0.5 bg-gray-900 "
            />
            <motion.div
              initial={{ rotate: 0, y: 0 }}
              animate={
                isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }
              }
              transition={{ duration: 0.2 }}
              className=" w-full h-0.5 bg-gray-900 origin-center"
            />
          </button>

          <AnimatePresence>
            {/* Mobile Menu */}
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: "100vh" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-100vh" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-14 pt-8 pb-8 w-screen px-8 h-svh left-0 bg-white dark:bg-gray-800 shadow-lg  p-4 flex flex-col  gap-8 md:hidden"
              >
                <div className="relative">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition self-start "
                  >
                    {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
                </div>
                <ul className="space-y-8">
                  {links.map(({ href, label }) => (
                    <li
                      key={href}
                      className="relative border rounded-xs border-gray-300 dark:border-gray-700 pb-2 h-10"
                    >
                      <Link
                        href={href}
                        className="font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors bg-white pb-2 dark:bg-gray-800 absolute w-[102%] -left-1 top-3  z-10"
                      >
                        <div className="flex justify-between items-center w-full px-3">
                          <span>{label}</span>
                          <span>
                            <ArrowRightIcon className="font-extralight text-gray-400 " />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
};
