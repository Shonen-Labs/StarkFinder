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
  RefreshCw,
  AlertCircle,
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

interface GenerationStatus {
  status: 'idle' | 'starting' | 'cleared' | 'generating' | 'streaming' | 'saving' | 'database' | 'completed' | 'error';
  message: string;
  contract?: string;
  error?: boolean;
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
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'idle',
    message: 'Ready to generate contract'
  });
  const [streamedContent, setStreamedContent] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

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
  }, [sourceCode, logs, streamedContent]);

  useEffect(() => {
    setSourceCode('');
    setStreamedContent('');
    setGenerationStatus({
      status: 'idle',
      message: 'Ready to generate contract'
    });
  }, [setSourceCode]);

  const updateStep = (index: number, updates: Partial<DeploymentStep>) => {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  };

  const compileContractHandler = async () => {
    if (!sourceCode.trim()) {
      addLog("No contract code available for deployment");
      return;
    }

    setIsDeploying(true);

    try {
      updateStep(0, { status: "processing" });
      addLog("Starting contract compilation...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStep(0, { status: "complete" });

      updateStep(1, { status: "processing" });
      addLog("Deploying contract to StarkNet...");
      
      const response = await fetch("/api/deploy-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contractName: "lib",
          userId: "default-user"
        }),
      });

      const data = await response.json();

      if (data.success) {
        addLog(`Contract deployed successfully! Address: ${data.contractAddress}`);
        
        updateStep(1, {
          status: "complete",
          hash: data.classHash,
        });
        updateStep(2, {
          status: "complete",
          hash: data.classHash,
        });
        updateStep(3, {
          status: "complete",
          details: data.contractAddress,
        });
        updateStep(4, {
          status: "complete",
          hash: data.transactionHash,
        });

        setResult({
          success: true,
          contractAddress: data.contractAddress,
          classHash: data.classHash,
          transactionHash: data.transactionHash,
        });
      } else {
        throw new Error(data.error || "Deployment failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog(`Deployment failed: ${errorMessage}`);
      
      const currentStep = steps.findIndex(
        (step) => step.status === "processing"
      );
      if (currentStep !== -1) {
        updateStep(currentStep, {
          status: "error",
          details: errorMessage,
        });
      }

      setResult({
        success: false,
        error: errorMessage,
        details: "Check the logs for more information"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const generateCodeHandler = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setSourceCode('');
    setStreamedContent('');
    setGenerationStatus({
      status: 'starting',
      message: 'Initializing contract generation...'
    });
    addLog("Starting contract generation...");
    
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          nodes: nodes || [],
          edges: edges || [],
          flowSummary: flowSummary || [],
          userId: "default-user",
          blockchain: "blockchain1"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContract = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: ') {
              try {
                const data = JSON.parse(line.substring(6));
                
                setGenerationStatus({
                  status: data.error ? 'error' : data.status === 'completed' ? 'completed' : data.status,
                  message: data.message,
                  error: data.error
                });

                addLog(data.message);

                if (data.content) {
                  accumulatedContract += data.content;
                  setStreamedContent(accumulatedContract);
                }

                if (data.status === 'completed' && data.contract) {
                  setSourceCode(data.contract);
                  setStreamedContent('');
                  addLog("Contract generation completed successfully!");
                }

                if (data.error) {
                  throw new Error(data.message);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Generation failed: ${errorMessage}`);
      setGenerationStatus({
        status: 'error',
        message: `Generation failed: ${errorMessage}`,
        error: true
      });
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

  const displayCode = sourceCode || streamedContent;
  const hasCode = displayCode.length > 0;

  const getStatusIcon = () => {
    switch (generationStatus.status) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating':
      case 'streaming':
      case 'saving':
      case 'database':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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

        <div className="flex items-center gap-3 p-3 bg-navy-800 rounded-lg border border-navy-600">
          {getStatusIcon()}
          <span className={`text-sm ${
            generationStatus.status === 'error' ? 'text-red-400' :
            generationStatus.status === 'completed' ? 'text-green-400' :
            'text-blue-400'
          }`}>
            {generationStatus.message}
          </span>
        </div>
        
        <div
          ref={containerRef}
          className={`text-black relative overflow-hidden rounded-xl bg-navy-800 border border-navy-600 ${
            editable ? "bg-yellow-200" : "bg-yellow-100"
          }`}
        >
          {showSourceCode && (
            <div className="relative">
              {!hasCode && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                  <div className="text-center text-gray-300">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="font-medium mb-2">No contract generated yet</h3>
                    <p className="text-sm">
                      Connect blocks and click &quot;Generate New&quot; to create your Cairo contract
                    </p>
                  </div>
                </div>
              )}
              <pre className={`p-6 overflow-y-auto max-h-[60vh] ${!hasCode ? 'opacity-30' : ''}`}>
                <code
                  contentEditable={editable && hasCode}
                  spellCheck="false"
                  style={{
                    outline: "none",
                    border: "none",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    padding: "0",
                  }}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    if (editable && e.currentTarget.textContent) {
                      setSourceCode(e.currentTarget.textContent);
                    }
                  }}
                >
                  {displayCode || "// Contract code will appear here after generation..."}
                </code>
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-2">
          <button
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 font-bold ${
              isDeploying || !hasCode || editable || isGenerating
                ? "bg-gray-500 cursor-not-allowed text-gray-300"
                : "bg-cyan-500 hover:bg-cyan-600 text-black"
            }`}
            style={{
              boxShadow: (isDeploying || !hasCode || editable || isGenerating) ? "none" : "0 0 15px rgba(100, 255, 218, 0.3)",
            }}
            onClick={compileContractHandler}
            disabled={isDeploying || !hasCode || editable || isGenerating}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              {isDeploying ? "Deploying..." : "Deploy"}
            </span>
          </button>

          {hasCode && (
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