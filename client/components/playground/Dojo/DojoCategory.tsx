"use client";

import { ReactNode, useState } from "react";
import DropdownArrowIcon from "@/components/svgs/DropdownArrowIcon";
import clsx from "clsx";
import { DojoBlock } from "./types";

interface DojoCategoryProps {
  title: string;
  icon: ReactNode;
  blocks: DojoBlock[];
  addBlock: (block: DojoBlock) => void;
}

export default function DojoCategory({ 
  title, 
  icon, 
  blocks, 
  addBlock 
}: DojoCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={clsx(
      "hover:bg-gray-200 rounded-lg",
      isOpen && "bg-gray-200"
    )}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 flex justify-between items-center cursor-pointer"
      >
        <div className="flex gap-3">
          <span>{icon}</span>
          <div className="text-black">{title}</div>
        </div>
        <div>
          {isOpen ? (
            <DropdownArrowIcon status="open" />
          ) : (
            <DropdownArrowIcon status="closed" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="ml-10 my-2 mr-2 flex flex-col gap-2">
          {blocks.map((block) => {
            const IconComponent = block.icon;
            
            return (
              <div
                key={block.id}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                onClick={() => {
                  // Ensure block has title property before passing to addBlock
                  // If title doesn't exist, use content as title
                  const blockWithTitle = {
                    ...block,
                    title: block.title || block.content
                  };
                  addBlock(blockWithTitle);
                }}
              >
                <div className="flex gap-3 items-center">
                  <IconComponent className="h-4 w-4" />
                  <div className="text-black">{block.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}