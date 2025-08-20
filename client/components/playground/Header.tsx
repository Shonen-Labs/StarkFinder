/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, CheckCircle } from "lucide-react";

interface Node {
  id: string;
  type: string;
  data: any;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface PlaygroundHeaderProps {
  showClearButton?: boolean;
  showFinishButton?: boolean;
  handleClear: () => void;
  nodes: Node[];
  edges: Edge[];
  flowSummary: string;
  selectedNode: Node | null;
  handleDelete: () => void;
  children?: React.ReactNode;
}

export default function PlaygroundHeader({
  showClearButton = true,
  showFinishButton = true,
  handleClear,
  nodes,
  edges,
  flowSummary,
  selectedNode,
  handleDelete,
  children,
}: PlaygroundHeaderProps) {
  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">
            StarkFinder Playground
          </h1>
          <div className="text-sm text-gray-400">
            {nodes.length} nodes, {edges.length} connections
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {children}
          
          {selectedNode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Node</span>
            </Button>
          )}
          
          {showClearButton && nodes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All</span>
            </Button>
          )}
          
          {showFinishButton && nodes.length > 0 && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Generate Contract</span>
            </Button>
          )}
        </div>
      </div>
      
      {flowSummary && (
        <div className="mt-2 text-sm text-gray-300 bg-gray-800 rounded px-3 py-2">
          <strong>Flow Summary:</strong> {flowSummary}
        </div>
      )}
    </header>
  );
}
