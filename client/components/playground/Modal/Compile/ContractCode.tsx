/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from "lucide-react";

interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  classHash?: string;
  transactionHash?: string;
  error?: string;
  details?: string;
}

interface ContractCodeProps {
  nodes: any; // Update with proper type if available
  edges: any; // Update with proper type if available
  flowSummary: any; // Update with proper type if available
  sourceCode: string;
  setSourceCode: (code: string) => void;
  setDisplayState: (state: any) => void; // Update with proper type if available
}

const ContractCode: React.FC<ContractCodeProps> = ({
  nodes,
  edges,
  flowSummary,
  sourceCode,
  setSourceCode,
  setDisplayState,
}) => {
  const [editable, setEditable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [sourceCode, logs]);

  const compileContractHandler = async (): Promise<void> => {
    setIsLoading(true);
    setResult(null);
    setLogs([]);
    addLog("Starting deployment process...");

    try {
      addLog("Compiling and deploying contract...");

      const response = await fetch("/api/deploy-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractName: "contractww_contractww" }),
      });

      const data: DeploymentResponse = await response.json();
      setResult(data);

      if (data.success) {
        addLog("✅ Deployment successful!");
        addLog(`📄 Contract Address: ${data.contractAddress}`);
        addLog(`🔗 Transaction Hash: ${data.transactionHash}`);
      } else {
        addLog(`❌ Error: ${data.error}`);
        if (data.details) {
          addLog(`📝 Details: ${data.details}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog(`❌ Error: ${errorMessage}`);
      setResult({
        success: false,
        error: "Deployment failed",
        details: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const auditCodeHandler = async (): Promise<void> => {
    const fetchStreamedData = async () => {
      const response = await fetch("/api/generate-contract", {
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
            const newSourceCode = sourceCode + decoder.decode(value);
            setSourceCode(newSourceCode);
          }
        }
      }
    };

    fetchStreamedData();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-black text-2xl font-bold">Contract Code</div>
        <div
          ref={containerRef}
          className={`text-black mt-1 overflow-y-auto pl-2 border-4 border-black rounded-xl min-h-[10vh] max-h-[40vh] ${
            editable ? "bg-yellow-200" : "bg-yellow-100"
          }`}
        >
          <pre>
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
        </div>

        <div className="flex gap-4 mt-2">
          <button 
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isLoading || editable 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={compileContractHandler}
            disabled={editable || isLoading}
          >
            {isLoading ? "Deploying..." : "Deploy"}
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
            onClick={() => setEditable(!editable)}
            disabled={isLoading}
          >
            {editable ? "Save" : "Edit"}
          </button>
          <button 
            className={`px-4 py-2 rounded-lg ${
              editable || isLoading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            onClick={auditCodeHandler}
            disabled={editable || isLoading}
          >
            Audit
          </button>
        </div>
      </div>

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

      {/* Deployment Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg border ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {result.success ? (
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-green-700">
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
                  <span className="font-medium">Contract Address:</span> {result.contractAddress}
                </div>
                <div className="mt-1">
                  <span className="font-medium">Class Hash:</span> {result.classHash}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-700">
              <div className="font-semibold">Deployment Failed</div>
              <div className="text-sm mt-1">{result.error}</div>
              {result.details && (
                <div className="text-sm mt-1 text-red-600">{result.details}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractCode;