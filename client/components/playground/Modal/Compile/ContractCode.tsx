/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Play,
  Edit2,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { DeploymentResponse, DeploymentStep } from "@/types/main-types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCodeStore } from "@/lib/codeStore";

interface ContractCodeProps {
  nodes: any;
  edges: any;
  flowSummary: any;
  sourceCode: string;
  setSourceCode: (code: string) => void;
  setDisplayState?: (state: any) => void;
  showSourceCode?: boolean;
  handleAudit?: () => void;
  handleCompile?: () => void;
  onOpenChange?: (open: boolean) => void;
}

const initialSteps: DeploymentStep[] = [
  { title: "Building Contract", status: "pending" },
  { title: "Declaring Sierra Hash", status: "pending" },
  { title: "Declaring CASM Hash", status: "pending" },
  { title: "Deploying Contract", status: "pending" },
  { title: "Confirming Transaction", status: "pending" },
];

const ContractCode: React.FC<ContractCodeProps> = ({
  nodes,
  edges,
  flowSummary,
  sourceCode,
  setSourceCode,
  setDisplayState,
  showSourceCode = true,
  onOpenChange,
}) => {
  const [steps, setSteps] = useState<DeploymentStep[]>(initialSteps);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editable, setEditable] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DeploymentResponse | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string): void => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toISOString().split("T")[1].split(".")[0]} - ${message}`,
    ]);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
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

  const compileContractHandler = async () => {
    setIsDeploying(true);

    try {
      // Step 1: Building Contract
      updateStep(0, { status: "processing" });
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

  const generateCodeHandler = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    addLog("Starting contract generation...");
    
    try {
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          nodes: nodes || [],
          edges: edges || [],
          flowSummary: flowSummary || [],
          userId: "default-user", // Replace with actual user ID
          blockchain: "blockchain1" // or "blockchain4" for Dojo
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clear existing code
      setSourceCode("");
      addLog("Generating contract...");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No reader available");
      }

      const chunks: string[] = [];
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          chunks.push(chunk);
        }
      }
      
      reader.releaseLock();
      
      // Set the final code (all chunks joined)
      const finalCode = chunks.join("");
      
      if (finalCode.trim()) {
        setSourceCode(finalCode);
        addLog("Contract generated successfully");
      } else {
        throw new Error("No code generated");
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      addLog(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const router = useRouter();

  const openInCodeEditor = () => {
    setIsLoading(true);
    const { setNodesStore, setEdgesStore, setFlowSummaryStore } =
      useCodeStore.getState();

    setEdgesStore(edges);
    setNodesStore(nodes);
    setFlowSummaryStore(flowSummary);

    router.push(`/devx/code`);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-8 p-8 bg-navy-900 rounded-2xl border border-navy-700 relative min-h-[500px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365f] shadow-[0_0_20px_rgba(100,255,218,0.1)]"
    >
      <div className="flex flex-col gap-8 pb-24">
        <motion.div
          className="text-4xl font-bold text-cyan-300"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Contract Code
        </motion.div>
        
        <div
          ref={containerRef}
          className={`text-black relative overflow-hidden rounded-xl bg-navy-800 border border-navy-600" ${
            editable ? "bg-yellow-200" : "bg-yellow-100"
          }`}
        >
          {showSourceCode && (
            <pre className="p-6 overflow-y-auto max-h-[60vh]">
              <code
                contentEditable={editable}
                spellCheck="false"
                style={{
                  outline: "none",
                  border: "none",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  padding: "0",
                }}
                suppressContentEditableWarning={true}
                onBlur={(e) => setSourceCode(e.currentTarget.textContent || "")}
              >
                {sourceCode}
              </code>
            </pre>
          )}
        </div>

        <div className="flex gap-4 mt-2">
          <button
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 font-bold ${
              isLoading || editable || isGenerating
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-600 text-black"
            }`}
            style={{
              boxShadow: "0 0 15px rgba(100, 255, 218, 0.3)",
            }}
            onClick={compileContractHandler}
            disabled={isDeploying || editable || isGenerating}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              {isDeploying ? "Deploying..." : "Deploy"}
            </span>
          </button>

          {sourceCode && (
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-50 ${
                isDeploying || isLoading || isGenerating
                  ? "bg-gray-500 cursor-not-allowed text-gray-300"
                  : "bg-gray-500 hover:bg-gray-600 text-white"
              }`}
              onClick={() => openInCodeEditor()}
              disabled={isDeploying || isLoading || isGenerating}
            >
              <span className="flex items-center justify-center gap-2 ">
                <Edit2 className="w-5 h-5" />
                Edit
              </span>
            </button>
          )}

          <button
            className={`px-4 py-2 rounded-lg ${
              editable || isLoading || isGenerating
                ? "bg-gray-500 cursor-not-allowed text-gray-300"
                : "bg-green-500 hover:bg-green-600 text-white font-bold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
            }`}
            style={{
              boxShadow: editable || isLoading || isGenerating ? "none" : "0 0 15px rgba(34, 197, 94, 0.3)",
            }}
            onClick={generateCodeHandler}
            disabled={editable || isDeploying || isGenerating}
          >
            <span className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              {isGenerating ? "Generating..." : "Generate New"}
            </span>
          </button>
        </div>

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
      </div>

      {/* Simple Logs */}
      {logs.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-cyan-300">Logs</h3>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div
            ref={logsContainerRef}
            className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-[200px] overflow-y-auto border border-gray-700"
          >
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-sm mb-1 text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployment Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`sticky bottom-0 left-0 right-0 p-6 border mt-4 rounded-lg ${
              result.success
                ? "bg-green-900/95 border-green-700"
                : "bg-red-900/95 border-red-700"
            }`}
          >
            {result.success ? (
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Deployment Successful!
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Transaction:</span>
                  <a
                    href={`https://sepolia.starkscan.co/tx/${result.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    View on Starkscan
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="text-sm text-gray-300">
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
                <div className="font-semibold text-xl flex items-center gap-2 text-white">
                  <XCircle className="w-6 h-6" />
                  Deployment Failed
                </div>
                <div className="text-sm mt-2 text-red-200">{result.error}</div>
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
    </motion.div>
  );
};

export default ContractCode;