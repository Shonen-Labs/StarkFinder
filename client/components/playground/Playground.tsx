"use client";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// Third-party libraries
import { motion } from "framer-motion";
import { } from "lucide-react";
import ReactFlow, {
  Background,
  Edge,
  Connection,
  Node,
  addEdge,
  getOutgoers,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  NodeProps,
  NodeTypes,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";
import BlockNode from "./Blocknode";
import BlockNodeInterface from "./Blocknode";
import EventNode from "./Blocknode/EventNode";
import LiquidityNode from "./Blocknode/LiquidityNode";
import StakeNode from "./Blocknode/StakeNode";
import SwapNode from "./Blocknode/SwapNode";
import Header from "../Header";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { FlowSummaryItem } from "@/types/main-types";
import FloatingSidebar from "./FloatingSidebar";
import { Button } from "@/components/ui/button";
import Compile from "./Modal/Compile";
import { X, Menu } from "lucide-react";


interface BlockNodeInterface extends NodeProps {
  isDragging: boolean;
}

// Define nodeTypes outside of the component
const nodeTypes: NodeTypes = {
  // as unknown?
  blockNode: BlockNode as unknown as React.ComponentType<NodeProps>,
  swapNode: SwapNode as React.ComponentType<NodeProps>,
  stakeNode: StakeNode as React.ComponentType<NodeProps>,
  liquidityNode: LiquidityNode as React.ComponentType<NodeProps>,
  eventNode: EventNode as React.ComponentType<NodeProps>,
};

// Form validation schema using Zod

// Main component for the DeFi Blocks builder
export default function Playground() {
  // State variables
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [flowSummary, setFlowSummary] = useState<FlowSummaryItem[]>([]);
  const [showClearButton, setShowClearButton] = useState(false);
  const edgeReconnectSuccessful = useRef(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);


  // Effect to check if 'start' and 'end' nodes are present
  useEffect(() => {
    const hasStart = nodes.some((node) => node.data.id === "start");
    const hasEnd = nodes.some((node) => node.data.id === "end");
    setShowFinishButton(hasStart && hasEnd);
    setShowClearButton(nodes.length > 0);
  }, [nodes]);

  // Function to handle node click (currently logs the node ID)
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            selected: n.id === node.id,
          },
          zIndex: n.id === node.id ? 50 : 0,
        }))
      );
    },
    [setNodes]
  );

  const { getNodes, getEdges } = useReactFlow();

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return false;

      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);

      const hasCycle = (
        node: Node,
        visited: Set<string> = new Set()
      ): boolean => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
        return false;
      };

      if (!target || target.id === connection.source) return false;
      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  const onConnect = useCallback(
    (params: any) => {
      if (isValidConnection(params)) {
        setEdges((els) => addEdge(params, els));
        updateFlowSummary(params.source, params.target);
      } else {
        toast.error("Invalid connection: This would create a cycle");
      }
    },
    [isValidConnection, updateFlowSummary]
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      if (newConnection.source && newConnection.target) {
        updateFlowSummary(newConnection.source, newConnection.target);
      }
    },
    [updateFlowSummary]
  );

  const onReconnectEnd = useCallback(
    (_: any, edge: { id: string; source: string; target: string }) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        // Remove the connection from the flow summary
        setFlowSummary((prevSummary) => {
          const sourceIndex = prevSummary.findIndex(
            (item) => item.id === edge.source
          );
          const targetIndex = prevSummary.findIndex(
            (item) => item.id === edge.target
          );
          if (sourceIndex !== -1 && targetIndex !== -1) {
            return prevSummary.slice(0, targetIndex);
          }
          return prevSummary;
        });
      }

      edgeReconnectSuccessful.current = true;
    },
    []
  );

  // Custom edge styles
  const edgeStyles = {
    default: {
      stroke: "#555",
      strokeWidth: 2,
      transition: "stroke 0.3s, strokeWidth 0.3s",
    },
    selected: {
      stroke: "#FE007A",
      strokeWidth: 3,
    },
  };

  // Edge update function
  const edgeUpdateHandler = useCallback((oldEdge: any, newConnection: any) => {
    return { ...oldEdge, ...newConnection };
  }, []);

  return (
    <div className="flex h-full relative justify-start flex-col bg-[#f9f7f3] text-black selectable-none ">
      <motion.div
        className=" w-full flex flex-col"
        animate={{ style: { marginLeft: isOpen ? "1rem" : "2rem" } }}
        transition={{ duration: 0.3 }}
      >
        <Header
        >
          <div className="flex items-center ml-2 gap-3">
            {!!selectedNode && (
              <Button
                onClick={() => handleDeleteNode(selectedNode)}
                className="px-4 bg-[#252525] hover:bg-[#323232] text-white h-8"
              >
                Delete node
              </Button>
            )}
            {showClearButton && (
              <Button
                onClick={handleClear}
                className="px-4 bg-[#252525] hover:bg-[#323232] text-white h-8"
              >
                Clear
              </Button>
            )}
            {showFinishButton && (
              <Compile
                nodes={nodes}
                edges={edges}
                isOpen={isCompileModalOpen}
                onOpenChange={setIsCompileModalOpen}
                flowSummary={flowSummary}
              />
            )}
          </div>
        </Header>
      </motion.div>
      <div className="flex flex-row">
        <div className="h-screen w-[312px] overflow-y-scroll overflow-x-hidden  hover:scrollbar-thumb-gray-400 scrollbar-transparent hide-scrollbar">
          <FloatingSidebar addBlock={addBlock} />
        </div>
        <div className="flex-1 rounded-lg shadow-inner p-4 min-h-[200px] h-screen overflow-hidden bg-transparent">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "step" }}
            snapToGrid={true}
            snapGrid={[15, 15]}
            isValidConnection={isValidConnection}
            onNodeClick={handleNodeClick}
            edgeUpdaterRadius={10}
            onEdgeUpdate={edgeUpdateHandler}
          >
            <Background />
            {edges.map((edge) => (
              <div
                key={edge.id}
                style={
                  selectedNode &&
                    (edge.source === selectedNode || edge.target === selectedNode)
                    ? edgeStyles.selected
                    : edgeStyles.default
                }
              >
                {/* Custom edge rendering logic can be added here */}
              </div>
            ))}
          </ReactFlow>
        </div>
      </div>
    </div>
  );

  // Function to delete a node and its associated edges
  function handleDeleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setFlowSummary((prevSummary) =>
      prevSummary.filter((item) => item.id !== nodeId)
    );
    toast.success("Block deleted");
  }

  // Function to update the flow summary based on the connected nodes
  function updateFlowSummary(sourceId: string, targetId: string) {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const targetNode = nodes.find((node) => node.id === targetId);

    setFlowSummary((prevSummary) => {
      const newItem = {
        content: targetNode?.data?.content || "",
        id: targetId,
      };

      // If the summary is empty, add the source node first
      if (prevSummary.length === 0) {
        return [
          { content: sourceNode?.data?.content || "", id: sourceId },
          newItem,
        ];
      }

      // Check if the target node already exists in the summary
      const existingIndex = prevSummary.findIndex(
        (item) => item.id === targetId
      );
      if (existingIndex !== -1) {
        // If it exists, remove it and all subsequent items
        return [...prevSummary.slice(0, existingIndex), newItem];
      } else {
        // If it doesn't exist, add it to the end
        return [...prevSummary, newItem];
      }
    });
  }

  // Form submission handler for adding a custom block

  // Function to clear the canvas
  function handleClear() {
    setNodes([]);
    setEdges([]);
    setFlowSummary([]);
    toast.success("Blocks cleared");
  }

  // Function to add a block to the canvas
  function addBlock(block: { id: string; content: any }) {
    const newNodeId = Date.now().toString();
    const newNode = {
      id: newNodeId,
      type:
        block.id === "stake"
          ? "stakeNode"
          : block.id === "swap"
            ? "swapNode"
            : block.id === "liquidity"
              ? "liquidityNode"
              : block.id === "event"
                ? "eventNode"
                : "blockNode",
      position: { x: 500, y: 100 + nodes.length * 100 },
      data: {
        ...block,
        onNodeClick: handleNodeClick,
        uniqueId: newNodeId,
        handleDeleteNode,
        handleAddNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`${block.content} block added`);
  }

  // Function to add a new node connected to a source node
  function handleAddNode(sourceNodeId: string, block: any) {
    const newNodeId = Date.now().toString();
    const sourceNode = nodes.find((node) => node.id === sourceNodeId);
    if (!sourceNode) {
      toast.error("Source node not found");
      return;
    }

    const newNode = {
      id: newNodeId,
      type: "blockNode",
      position: { x: sourceNode.position.x, y: sourceNode.position.y + 150 },
      data: {
        ...block,
        onNodeClick: handleNodeClick,
        uniqueId: newNodeId,
        handleDeleteNode,
        handleAddNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);

    const newEdge = {
      id: `edge-${sourceNodeId}-${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
      type: "step",
    };
    setEdges((eds) => [...eds, newEdge]);

    updateFlowSummary(sourceNodeId, newNodeId);
    toast.success(`${block.content} block added`);
  }

  interface CairoLintError {
    line: number;
    column?: number;
    message: string;
    severity: "error" | "warning";
  }

  interface CairoEditorProps {
    code: string;
    onChange?: (code: string) => void;
    readOnly?: boolean;
  }

  const CairoEditor = ({
    code,
    onChange,
    readOnly = false,
  }: CairoEditorProps) => {
    const [lintErrors, setLintErrors] = useState<CairoLintError[]>([]);

    const lintCairoCode = (sourceCode: string): CairoLintError[] => {
      const errors: CairoLintError[] = [];
      const lines = sourceCode.split("\n");

      lines.forEach((line, index) => {
        // Check function declarations
        if (line.includes("fn") && !line.includes("->")) {
          errors.push({
            line: index + 1,
            message: "Function declaration missing return type",
            severity: "error",
          });
        }

        // Check type annotations
        if (line.includes("let") && !line.includes(":")) {
          errors.push({
            line: index + 1,
            message: "Variable declaration missing type annotation",
            severity: "error",
          });
        }

        // Check semicolons
        if (
          line.trim() &&
          !line.trim().endsWith(";") &&
          !line.trim().endsWith("{") &&
          !line.trim().endsWith("}") &&
          !line.trim().startsWith("#") &&
          !line.trim().startsWith("use")
        ) {
          errors.push({
            line: index + 1,
            message: "Missing semicolon",
            severity: "error",
          });
        }

        // Check for proper module imports
        if (line.includes("use") && !line.includes("::")) {
          errors.push({
            line: index + 1,
            message: "Invalid module import syntax",
            severity: "warning",
          });
        }

        // Check for proper visibility modifiers
        if (
          line.includes("fn") &&
          !line.includes("pub") &&
          !line.trim().startsWith("    ")
        ) {
          errors.push({
            line: index + 1,
            message: "Consider adding visibility modifier (pub/internal)",
            severity: "warning",
          });
        }

        // Check for magic numbers
        const numbers = line.match(/\b\d+\b/g);
        if (numbers && !line.includes("const")) {
          errors.push({
            line: index + 1,
            message: "Consider using named constants instead of magic numbers",
            severity: "warning",
          });
        }
      });

      return errors;
    };

    useEffect(() => {
      setLintErrors(lintCairoCode(code));
    }, [code]);

    return (
      <div className="w-full space-y-4">
        <div className="relative">
          <SyntaxHighlighter
            language="cairo"
            style={oneDark}
            className="min-h-[200px] p-4 rounded-lg font-mono text-sm"
            showLineNumbers
            wrapLines
            customStyle={{
              backgroundColor: "#1E293B",
              margin: 0,
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {lintErrors.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 text-sm">
            <h3 className="text-white font-medium mb-2">Lint Results:</h3>
            <div className="space-y-2">
              {lintErrors.map((error, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 ${error.severity === "error"
                    ? "text-red-400"
                    : "text-yellow-400"
                    }`}
                >
                  <span className="font-mono">Line {error.line}:</span>
                  <span className="flex-1">{error.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
}
