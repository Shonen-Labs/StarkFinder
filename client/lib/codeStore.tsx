import { FlowSummaryItem } from "@/types/main-types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define more specific types for nodes and edges
interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  [key: string]: unknown;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
  style?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CodeStore {
  sourceCode: string;
  setSourceCodeStore: (code: string) => void;
  nodes: Node[];
  setNodesStore: (nodes: Node[]) => void;
  edges: Edge[];
  setEdgesStore: (edges: Edge[]) => void;
  flowSummary: FlowSummaryItem[];
  setFlowSummaryStore: (summary: FlowSummaryItem[]) => void;
}

// Use the persist middleware to automatically save state to localStorage
export const useCodeStore = create<CodeStore>()(
  persist(
    (set) => ({
      sourceCode: "",  // Default empty - will be populated from localStorage or by component
      setSourceCodeStore: (code) => set({ sourceCode: code }),
      nodes: [],
      setNodesStore: (nodes) => set({ nodes }),
      edges: [],
      setEdgesStore: (edges) => set({ edges }),
      flowSummary: [],
      setFlowSummaryStore: (flowSummary) => set({ flowSummary }),
    }),
    {
      name: "code-store", // Name for localStorage key
      partialize: (state) => ({ sourceCode: state.sourceCode }), // Only persist sourceCode
    }
  )
);