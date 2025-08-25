"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import "./style.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    { id: 0, name: "Companies" },
    { id: 1, name: "Write a review" },
    { id: 2, name: "About" },
    { id: 3, name: "Docs" },
  ];

  return (
    <div className="navbar">
      {/* Brand */}
      <div className="nav-name">
        <h1>Anondoor</h1>
      </div>

      {/* Desktop nav */}
      <nav className="nav-links">
        {routes.map((route) => (
          <div key={route.id}>
            <p>{route.name}</p>
          </div>
        ))}
      </nav>

      {/* Desktop CTAs */}
      <div className="nav-cta">
        <button className="secondary-button-nav">Sign in</button>
        <button className="primary-button-nav">
          <img className="button-bg" src="/bg/button.png" alt="" />
          Connect Wallet
        </button>
      </div>

      {/* Mobile toggle */}
      <button
        className="menu-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X className="icon" /> : <Menu className="icon" />}
      </button>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mobile-menu"
          >
            <nav className="mobile-nav">
              {routes.map((route) => (
                <p key={route.id} className="mobile-link">
                  {route.name}
                </p>
              ))}
            </nav>
            <div className="mobile-cta">
              <button className="secondary-button-nav">Sign in</button>
              <button className="primary-button-nav">
                <img className="button-bg" src="/bg/button.png" alt="" />
                Connect Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
