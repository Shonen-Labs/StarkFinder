/* eslint-disable @typescript-eslint/no-explicit-any */

import { FlowSummaryItem } from "@/types/main-types";
import { create } from "zustand";

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

export const useCodeStore = create<CodeStore>((set) => ({
  sourceCode: "",
  setSourceCodeStore: (code) => set({ sourceCode: code }),
  nodes: [],
  setNodesStore: (nodes) => set({ nodes }),
  edges: [],
  setEdgesStore: (edges) => set({ edges }),
  flowSummary: [],
  setFlowSummaryStore: (flowSummary) => set({ flowSummary }),
}));
