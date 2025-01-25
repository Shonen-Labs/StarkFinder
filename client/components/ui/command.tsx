"use client";
import React, { useEffect, useState } from "react";
import Swap from "./swap";
import Transfer from "./transfer";
import Deposit from "./deposit";
import Withdraw from "./withdraw";
import Bridge from "./bridge";

const commands = ["Transfer", "Swap", "Deposit", "Withdraw", "Bridge"];

const CommandList = () => {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCommand) {
      setShowModal(true);
    }
  }, [selectedCommand]);

  return (
    <div>
      {showModal && (
        <div>
          {selectedCommand === "Swap" ? (
            <Swap setSelectedCommand={setSelectedCommand} />
          ) : selectedCommand === "Transfer" ? (
            <Transfer setSelectedCommand={setSelectedCommand} />
          ) : selectedCommand === "Deposit" ? (
            <Deposit setSelectedCommand={setSelectedCommand} />
          ) : selectedCommand === "Withdraw" ? (
            <Withdraw setSelectedCommand={setSelectedCommand} />
          ) : selectedCommand === "Bridge" ? (
            <Bridge setSelectedCommand={setSelectedCommand} />
          ) : null}
        </div>
      )}
      <div className="flex justify-center mb-5 animated fadeIn">
        <div className="w-full max-w-lg bg-[#010101] text-white rounded-lg shadow-md p-4 border-2 border-white/10">
          <h2 className="text-lg font-bold mb-4">Commands</h2>
          <div
            className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-[#060606]
              [&::-webkit-scrollbar-thumb]:bg-white/10
              [&::-webkit-scrollbar-thumb]:rounded-full
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
          >
            {commands.map((command, index) => (
              <div
                key={index}
                className="flex items-center p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedCommand(command)}
              >
                {command}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandList;
