/* eslint-disable @typescript-eslint/no-unused-vars */

import { motion, AnimatePresence } from "framer-motion";
import { useCodeStore } from "@/lib/codeStore";
import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import { Button } from "../ui/button";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-rust";
import "prismjs/themes/prism-dark.css";
import {
  ExternalLink,
  Play,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { DeploymentResponse, DeploymentStep } from "@/types/main-types";
import { useRouter } from "next/navigation";

const DEFAULT_CONTRACT = `#[starknet::contract]
mod contract {
    use starknet::{ContractAddress, get_caller_address};
    
    #[storage]
    struct Storage {
        owner: ContractAddress,
        balance: LegacyMap::<ContractAddress, u256>,
        total_supply: u256,
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
    }
    
    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }
    
    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256) {
        let sender = get_caller_address();
        self.owner.write(sender);
        self.total_supply.write(initial_supply);
        self.balance.write(sender, initial_supply);
    }
    
    #[external(v0)]
    fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        let sender = get_caller_address();
        let sender_balance = self.balance.read(sender);
        assert(sender_balance >= amount, "Insufficient balance");
        
        self.balance.write(sender, sender_balance - amount);
        self.balance.write(recipient, self.balance.read(recipient) + amount);
        
        self.emit(Event::Transfer(Transfer { from: sender, to: recipient, value: amount }));
    }
    
    #[external(v0)]
    fn get_balance(self: @ContractState, account: ContractAddress) -> u256 {
        self.balance.read(account)
    }
    
    #[external(v0)]
    fn get_total_supply(self: @ContractState) -> u256 {
        self.total_supply.read()
    }
}`;

const initialSteps: DeploymentStep[] = [
  { title: "Building Contract", status: "pending" },
  { title: "Declaring Sierra Hash", status: "pending" },
  { title: "Declaring CASM Hash", status: "pending" },
  { title: "Deploying Contract", status: "pending" },
  { title: "Confirming Transaction", status: "pending" },
];

export default function CodeEditor() {
  const router = useRouter();
  const sourceCode = useCodeStore((state) => state.sourceCode);
  const setSourceCode = useCodeStore((state) => state.setSourceCodeStore);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DeploymentResponse | null>(null);
  const [steps, setSteps] = useState<DeploymentStep[]>(initialSteps);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with default if no code was passed
  useEffect(() => {
    if (!sourceCode) {
      setSourceCode(DEFAULT_CONTRACT);
    }
  }, [sourceCode, setSourceCode]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [sourceCode, logs]);

  const updateStep = (index: number, updates: Partial<DeploymentStep>) => {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  };

  const [isAuditing, setIsAuditing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleAudit = async (): Promise<void> => {
    setIsAuditing(true);
    const fetchStreamedData = async () => {
      try {
        const response = await fetch("/api/audit-sourcecode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sourceCode }),
        });
        setSourceCode("");
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let done = false;
          while (!done) {
            const { value, done: isDone } = await reader.read();
            done = isDone;
            if (value) {
              const decodedValue = decoder.decode(value);
              try {
                const parsedValue = JSON.parse(decodedValue);
                if (parsedValue.error) {
                  setResult({
                    success: false,
                    error: parsedValue.error,
                    details: parsedValue.details,
                    title: "Audit Error",
                  });
                  throw new Error(parsedValue.error);
                } else {
                  // If it's valid JSON but not an error, update source code
                  const newSourceCode = sourceCode + decodedValue;
                  setSourceCode(newSourceCode);
                }
              } catch (jsonError) {
                // If it's not valid JSON, just treat it as regular text
                const newSourceCode = sourceCode + decodedValue;
                setSourceCode(newSourceCode);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching streamed data:", error);
      } finally {
        setIsAuditing(false);
      }
    };

    fetchStreamedData();
  };

  const handleCompile = async (): Promise<void> => {
    setIsDeploying(true);

    try {
      // Step 1: Building Contract
      updateStep(0, { status: "processing" });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate build time
      updateStep(0, { status: "complete" });

      // Step 2: Declaring Sierra Hash
      updateStep(1, { status: "processing" });
      const response = await fetch("/api/deploy-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractName: "contractww_contractww" }),
      });

      const data = await response.json();

      if (data.success) {
        // Update steps with actual data
        updateStep(1, {
          status: "complete",
          hash: data.classHash,
        });
        updateStep(2, {
          status: "complete",
          hash: data.casmHash,
        });
        updateStep(3, {
          status: "complete",
          details: data.contractAddress,
        });
        updateStep(4, {
          status: "complete",
          hash: data.transactionHash,
        });
      } else {
        throw new Error(data.error || "Deployment failed");
      }
    } catch (error) {
      const currentStep = steps.findIndex(
        (step) => step.status === "processing"
      );
      if (currentStep !== -1) {
        updateStep(currentStep, {
          status: "error",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const backToDevx = async () => {
    setSourceCode("");
    setResult(null);
    setSteps(initialSteps);
    setLogs([]);

    router.push("/devx");
  };
  {
    return (
      <div className="flex h-full relative justify-start flex-col bg-[#f9f7f3] text-black pt-4 selectable-none">
        <motion.div
          className=" w-full flex flex-col ml-8"
          animate={{ style: { marginLeft: "2rem" } }}
          transition={{ duration: 0.3 }}
        >
          <Header />
        </motion.div>
        <div className="flex flex-col items-center justify-center">
          {/* <h1 className="text-3xl font-bold  mb-2">Code Playground</h1> */}
          <p className="">Edit, compile, and deploy Starknet smart contracts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mt-2 px-4">
          {/* <div className="flex justify-center mt-2 w-80vw"> */}
          <div className="lg:col-span-4 bg-[#1E1E1E] rounded-2xl shadow-lg">
            {/* <div className=" bg-[#1E1E1E] rounded-lg shadow-lg overflow-hidden w-[80%]"> */}
            <div className="p-4 bg-[#252526] rounded-2xl border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-white font-medium">Cairo Contract Editors</h2>
              <div className="space-x-2">
                <Button
                  onClick={() => backToDevx()}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back to BlockPlayground
                </Button>
                <Button
                  onClick={() => handleAudit()}
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={isAuditing}
                >
                  <Shield className="w-5 h-5" />
                  {isAuditing ? "Auditing..." : "Audit Contract"}
                </Button>
                <Button
                  onClick={() => handleCompile()}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isDeploying}
                >
                  <Play className="w-5 h-5" />
                  {isDeploying ? "Compiling..." : "Compile & Deploy"}
                </Button>
              </div>
            </div>
            <div className="h-[70vh] overflow-auto rounded-lg">
              <Editor
                value={sourceCode}
                onValueChange={(code) => setSourceCode(code)}
                highlight={(code) => highlight(code, languages.rust)}
                padding={16}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                  backgroundColor: "#1E1E1E",
                  minHeight: "100%",
                  color: "white",
                }}
                textareaClassName="focus:outline-none"
                spellCheck={false}
                disabled={isAuditing || isDeploying}
              />
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl flex flex-col shadow-lg">
            {/* Deployment Steps */}
            <Card className="mt-4 p-4">
              <Steps
                items={steps.map((step) => ({
                  title: step.title,
                  status: step.status,
                  description: step.details && (
                    <div className="text-sm">
                      {step.hash ? (
                        <a
                          href={`https://starkscan.co/tx/${step.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                          {step.hash.slice(0, 6)}...{step.hash.slice(-4)}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        step.details
                      )}
                    </div>
                  ),
                }))}
              />
            </Card>

            {/* Deployment Logs */}
            {logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Deployment Logs</h3>
                <div
                  ref={logsContainerRef}
                  className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-[200px] overflow-y-auto"
                >
                  {logs.map((log, index) => (
                    <div key={index} className="font-mono text-sm mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`sticky bottom-0 left-0 right-0 p-6 border mt-4 ${
                    result.success
                      ? "bg-green-900/95 border-green-700"
                      : "bg-red-900/95 border-red-700"
                  }`}
                >
                  {result.success ? (
                    <div className="flex flex-col gap-2">
                      <div className="font-semibold text-white">
                        <CheckCircle className="w-6 h-6" />
                        Deployment Successful!
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Transaction:</span>
                        <a
                          href={`https://sepolia.starkscan.co/tx/${result.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          View on Starkscan
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="mt-1">
                          <span className="font-medium">Contract Address:</span>{" "}
                          {result.contractAddress}
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">Class Hash:</span>{" "}
                          {result.classHash}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="">
                      <div className="font-semibold text-xl flex items-center gap-2">
                        <XCircle className="w-6 h-6" />
                        {result.title ?? "Deployment Failed"}
                      </div>
                      <div className="text-sm mt-2">{result.error}</div>
                      {result.details && (
                        <div className="text-sm mt-2 text-white">
                          {result.details}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }
}
