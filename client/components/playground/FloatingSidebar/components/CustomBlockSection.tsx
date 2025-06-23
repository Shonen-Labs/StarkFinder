import React from "react";
import { Code } from "lucide-react";
import MenuIcon from "@/components/svgs/MenuIcon";
import { Block } from "../types";

interface CustomBlockSectionProps {
  customBlocks: Block[];
  addBlock: (block: Block) => void;
  setIsCustomModalOpen: (open: boolean) => void;
}

export const CustomBlockSection: React.FC<CustomBlockSectionProps> = ({
  customBlocks,
  addBlock,
  setIsCustomModalOpen,
}) => (
  <div className="mt-4">
    <div className="hover:bg-gray-200 rounded-lg">
      <div
        onClick={() => setIsCustomModalOpen(true)}
        className="px-3 py-2 flex justify-between items-center cursor-pointer"
      >
        <div className="flex gap-3">
          <span><MenuIcon /></span>
          <div className="text-black">Custom</div>
        </div>
        <div>
          <Code className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      {customBlocks.length > 0 && (
        <div className="ml-10 my-2 mr-2 flex flex-col gap-2">
          {customBlocks.map((block, index) => (
            <div
              key={`custom-${index}-${block.content}`}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
            >
              <div
                className="flex justify-between items-center"
                onClick={() => addBlock(block)}
              >
                <div className="flex gap-3">
                  <span><Code className="h-4 w-4" /></span>
                  <div className="text-black hover:font-medium">
                    {block.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);