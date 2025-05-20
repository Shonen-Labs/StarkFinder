import { FlowSummaryItem } from "@/types/main-types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CodeStore {
  sourceCode: string;
  setSourceCodeStore: (code: string) => void;
  nodes: any;
  setNodesStore: (nodes: any) => void;
  edges: any;
  setEdgesStore: (edges: any) => void;
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