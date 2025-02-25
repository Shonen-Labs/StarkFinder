/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A header (navbar) component featuring:
 * - An editable title on the left
 * - Navigation links in the center
 * - Action buttons (Delete, Clear, Finish) on the right
 */

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Compile from "../Modal/Compile";

interface HeaderProps {
  /** Whether to show the "Clear" button. */
  showClearButton: boolean;
  /** Whether to show the "Finish" (Compile) button. */
  showFinishButton: boolean;
  /** Called when the Clear button is clicked. */
  handleClear: () => void;
  /** Node data used in flow. */
  nodes: any;
  /** Edge data used in flow. */
  edges: any;
  /** Summary data about the current flow. */
  flowSummary: any;
  /** The currently selected node (null/undefined if none). */
  selectedNode: any;
  /** Called to delete the selected node. */
  handleDelete: (node: any) => void;
}

export default function Header({
  showClearButton,
  showFinishButton,
  handleClear,
  nodes,
  edges,
  flowSummary,
  selectedNode,
  handleDelete,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState("DevXStark");
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);

  // If 'selectedNode' is truthy, we show the "Delete node" button
  const isDeleteVisible = !!selectedNode;

  return (
    <div className="flex items-center m-4">
      {/* Left side: Editable Title */}
      <div className="flex-1 flex items-center gap-4 ml-8">
        {isEditing ? (
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            className="text-2xl text-black font-semibold bg-transparent outline-none border-b border-white"
            autoFocus
          />
        ) : (
          <h2
            className="text-2xl font-semibold text-black cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {projectName || "Project Name"}
          </h2>
        )}
      </div>

      {/* Center: Nav Links */}
      <div className="flex-1 flex justify-center">
        <ul className="flex gap-6">
          <li>
            <Link href="/" className="hover:text-blue-500 transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link href="/deploy" className="hover:text-blue-500 transition-colors">
              Deploy
            </Link>
          </li>
          <li>
            <Link href="/agent/chat/someId" className="hover:text-blue-500 transition-colors">
              Agent
            </Link>
          </li>
          <li>
            <Link href="/devx/resources" className="hover:text-blue-500 transition-colors">
              Resources
            </Link>
          </li>
        </ul>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex-1 flex justify-end gap-2 mr-8">
        {isDeleteVisible && (
          <Button
            onClick={() => handleDelete(selectedNode)}
            className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
          >
            Delete node
          </Button>
        )}
        {showClearButton && (
          <Button
            onClick={handleClear}
            className="px-6 bg-[#252525] hover:bg-[#323232] text-white"
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
    </div>
  );
}
