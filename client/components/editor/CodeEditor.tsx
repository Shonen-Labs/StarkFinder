import { motion, AnimatePresence } from "framer-motion";
import { useCodeStore } from "@/lib/codeStore";
import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import { Button } from "../ui/button";
import Editor from "react-simple-code-editor";
import { useAccount } from "@starknet-react/core";
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
  ScrollText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { DeploymentResponse, DeploymentStep } from "@/types/main-types";
import { useRouter } from "next/navigation";
import { scarbGenerator } from "@/lib/devxstark/scarb-generator";
import { extractConstructorArgs, ConstructorArg, initialSteps, initializeCodeStore, extractImports, generateScarb } from "@/lib/codeEditor";

interface ExtendedDeploymentResponse extends DeploymentResponse {
  casmHash?: string;
}

export default function CodeEditor() {
  const router = useRouter();
  const setSourceCode = useCodeStore((state) => state.setSourceCodeStore);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isGeneratingScarb, setIsGeneratingScarb] = useState(false);
  const [generatedScarbToml, setGeneratedScarbToml] = useState("");
  const { isConnected } = useAccount();
  const [errorLogs, setErrorLogs] = useState("");
  const [constructorArgs, setConstructorArgs] = useState<ConstructorArg[]>([]);
  // const { connect, connectors } = useConnect();

  // Get sourceCode AFTER initialization to ensure we have the right value
  const sourceCode = useCodeStore((state) => state.sourceCode);

  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DeploymentResponse | null>(null);
  const [steps, setSteps] = useState<DeploymentStep[]>(initialSteps);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [contractName, setContractName] = useState("");
  const [createScarb, setCreateScarb] = useState("");
  const [showScarb, setShowScarb] = useState(false);

  useEffect(() => {
    if (sourceCode) {
      const constructor = extractConstructorArgs(sourceCode);
      setConstructorArgs(constructor);
    }
  }, [sourceCode])

  // Initialize code store and component state from localStorage on mount
  useEffect(() => {
    // Only initialize once
    if (!hasInitialized) {
      initializeCodeStore(setSourceCode);

      // Load contract name if available
      const savedContractName = localStorage.getItem("contractName");
      if (savedContractName) {
        setContractName(savedContractName);
      }

      setHasInitialized(true);
    }
  }, [hasInitialized, setSourceCode]);

  // Save to localStorage whenever sourceCode changes (but only after initialization)
  useEffect(() => {
    if (hasInitialized && sourceCode) {
      localStorage.setItem("editorCode", sourceCode);
    }
  }, [sourceCode, hasInitialized]);

  // Save contract name to localStorage when it changes
  useEffect(() => {
    if (contractName) {
      localStorage.setItem("contractName", contractName);
    }
  }, [contractName]);

  // Scroll logs to bottom when they change
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const updateStep = (index: number, updates: Partial<DeploymentStep>) => {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  };

  const [isAuditing, setIsAuditing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);


  const handleConstructorArgs = (index: number, newValue: string) => {
    const updatedArgs = [...constructorArgs];
    updatedArgs[index].value = newValue;
    setConstructorArgs(updatedArgs);
  };

  const handleAudit = async (): Promise<void> => {
    if (!sourceCode) {
      console.error("Source code is empty, cannot audit");
      return;
    }

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

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let done = false;
          let accumulatedCode = sourceCode; // Start with current code

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
                  accumulatedCode += decodedValue;
                  setSourceCode(accumulatedCode);
                }
              } catch (jsonError) {
                console.log(jsonError);
                // If it's not valid JSON, just treat it as regular text
                accumulatedCode += decodedValue;
                setSourceCode(accumulatedCode);
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

  const handleGenerateScarb = async () => {
    if (!sourceCode) {
      console.error("No source code to generate Scarb.toml from");
      return;
    }
    setIsGeneratingScarb(true);
    try {
      // Use the new AI-powered generator
      const scarbToml = await scarbGenerator.generateScarbToml(
        sourceCode,
        contractName || "GeneratedContract"
      );

      setCreateScarb(scarbToml);
      setGeneratedScarbToml(scarbToml);
      setShowScarb(true);

      // Save the generated Scarb.toml to localStorage for persistence
      localStorage.setItem("generatedScarbToml", scarbToml);
    } catch (error) {
      console.error("Error generating Scarb.toml:", error);
      // Fallback to basic generation
      const dependencies = extractImports(sourceCode);
      const toml = generateScarb(dependencies);
      setCreateScarb(toml);
      setGeneratedScarbToml(toml);
      setShowScarb(true);
    } finally {
      setIsGeneratingScarb(false);
    }
  };

  const handleCompile = async (): Promise<void> => {
    setIsDeploying(true);
    setResult(null);
    setErrorLogs("");

    try {
      if (constructorArgs.length > 0) {
        const arg = constructorArgs.find(arg => !arg.value || arg.value.trim() === "");

        if (arg) {
          throw new Error(`Constructor argument "${arg.name}" is not set.`);
        }
      }

      // Generate Scarb.toml if not already generated
      let scarbToml = generatedScarbToml;
      if (!scarbToml) {
        scarbToml = await scarbGenerator.generateScarbToml(
          sourceCode,
          contractName || "GeneratedContract"
        );
        setGeneratedScarbToml(scarbToml);
        setCreateScarb(scarbToml);
      }

      // Step 1: Building Contract
      updateStep(0, { status: "processing" });
      setLogs((prev) => [...prev, "Starting contract build..."]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStep(0, { status: "complete" });

      // Step 2: Declaring Sierra Hash
      updateStep(1, { status: "processing" });

      const response = await fetch("/api/deploy-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName: contractName || "lib",
          sourceCode: sourceCode,
          scarbToml: scarbToml,
          userId: localStorage.getItem("userId"), // Assuming you store userId
          constructorArgs: JSON.stringify(constructorArgs)
        }),
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

        setResult({
          success: true,
          contractAddress: data.contractAddress,
          classHash: data.classHash,
          transactionHash: data.transactionHash,
          casmHash: data.casmHash,
          title: "Deployment Successful",
        } as ExtendedDeploymentResponse);
        setLogs((prev) => [...prev, "✅ Contract deployed successfully!"]);
      } else {
        if (data.errorLog) {
          setErrorLogs(data.errorLog);
        }
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

      // For all remaining pending steps, mark as error
      steps.forEach((step, index) => {
        if (step.status === "pending") {
          updateStep(index, { status: "error" });
        }
      });

      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        title: "Deployment Failed",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Load generated Scarb.toml from localStorage on mount
  useEffect(() => {
    if (hasInitialized) {
      const savedScarbToml = localStorage.getItem("generatedScarbToml");
      if (savedScarbToml) {
        setGeneratedScarbToml(savedScarbToml);
        setCreateScarb(savedScarbToml);
      }
    }
  }, [hasInitialized]);

  // Clear localStorage and state when going back
  const backToDevx = () => {
    // Clear the state and local storage before navigating away
    localStorage.removeItem("editorCode");
    localStorage.removeItem("contractName");
    localStorage.removeItem("generatedScarbToml");
    setSourceCode("");
    setResult(null);
    setSteps(initialSteps);
    setLogs([]);
    setShowScarb(false);
    setGeneratedScarbToml("");
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
                  onClick={handleGenerateScarb}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  disabled={isGeneratingScarb || showScarb}
                >
                  <ScrollText className="w-5 h-5" />
                  {isGeneratingScarb
                    ? "Generating..."
                    : showScarb
                      ? "Scarb Generated"
                      : "Generate Scarb"}
                </Button>
                <Button
                  onClick={() => (isConnected ? handleCompile() : null)}
                  className="bg-blue-600 hover:bg-blue-700 relative group"
                  disabled={isDeploying || !isConnected}
                >
                  <Play className="w-5 h-5" />
                  {isDeploying ? "Compiling..." : "Compile & Deploy"}

                  {/* Wallet connection tooltip */}
                  {!isConnected && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      ← Connect wallet first
                      <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-800 transform -translate-x-1/2 translate-y-1/2 rotate-45"></div>
                    </div>
                  )}
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

            {/* Constructor Args */}
            {
              constructorArgs.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Constructor Args</h3>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-3">
                    {constructorArgs.map((arg, index) => (
                      <div key={index} className="font-mono text-sm flex items-center space-x-2">
                        <span>{arg.name}:</span>
                        <span className="text-blue-300">{arg.type}</span>
                        <input
                          type="text"
                          placeholder="value"
                          value={arg.value ?? ""}
                          onChange={(e) => handleConstructorArgs(index, e.target.value)}
                          className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 w-40"
                        />
                      </div>
                    ))}
                  </div>
                </div>)
            }

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

            {/* Compilation Logs */}
            {errorLogs &&
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Compilation Logs</h3>
                <div
                  className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-[200px] overflow-y-auto"
                >
                  <div className="font-mono text-sm mb-1">
                    {errorLogs}
                  </div>
                </div>
              </div>
            }

            {/* Scarb.toml */}
            {showScarb && (
              <Card className="mt-4 p-4 bg-black text-yellow-300">
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Generated Scarb.toml
                </h3>
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {createScarb}
                </pre>
              </Card>
            )}

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`sticky bottom-0 left-0 right-0 p-6 border mt-4 ${result.success
                    ? "bg-green-900/95 border-green-700"
                    : "bg-red-900/95 border-red-700"
                    }`}
                >
                  {result.success ? (
                    <div className="flex flex-col gap-2">
                      <div className="absolute top-2 right-2 cursor-pointer p-3">
                        <XCircle className="w-6 h-6" onClick={() => setResult(null)} />
                      </div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="w-6 h-6" />
                        Deployment Successful!
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">Transaction:</span>
                        <a
                          href={`https://sepolia.starkscan.co/tx/${result.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 flex items-center gap-1"
                        >
                          View on Starkscan
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="text-sm text-gray-200">
                        <div className="mt-1">
                          <span className="font-medium">Contract Address:</span>{" "}
                          <code className="bg-black/20 px-1 rounded">
                            {result.contractAddress}
                          </code>
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">Class Hash:</span>{" "}
                          <code className="bg-black/20 px-1 rounded">
                            {result.classHash}
                          </code>
                        </div>
                        {(result as ExtendedDeploymentResponse).casmHash && (
                          <div className="mt-1">
                            <span className="font-medium">CASM Hash:</span>{" "}
                            <code className="bg-black/20 px-1 rounded">
                              {(result as ExtendedDeploymentResponse).casmHash}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-white">
                      <div className="font-semibold text-xl flex items-center gap-2">
                        <XCircle className="w-6 h-6" onClick={() => setResult(null)} />
                        {result.title ?? "Deployment Failed"}
                      </div>
                      <div className="text-sm mt-2">{result.error}</div>
                      {result.details && (
                        <div className="text-sm mt-2 text-gray-200">
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
