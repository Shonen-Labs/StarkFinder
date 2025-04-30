"use client";

import { Globe, Layers, Grid3X3, FileText, Box } from "lucide-react";
import dojoBlocks from "./DojoBlocks";
import DojoCategory from "./DojoCategory";

interface DojoBlocksSidebarProps {
  addBlock: (block: any) => void;
}

export default function DojoBlocksSidebar({ addBlock }: DojoBlocksSidebarProps) {
  return (
    <div className="flex flex-col h-full gap-6">
      <h4 className="text-gray-400 font-medium">Dojo</h4>
      
      <DojoCategory
        title="World"
        icon={<Globe className="h-4 w-4" />}
        blocks={dojoBlocks.World}
        addBlock={addBlock}
      />
      
      <DojoCategory
        title="Namespace"
        icon={<Layers className="h-4 w-4" />}
        blocks={dojoBlocks.Namespace}
        addBlock={addBlock}
      />
      
      <DojoCategory
        title="Models"
        icon={<Grid3X3 className="h-4 w-4" />}
        blocks={dojoBlocks.Model}
        addBlock={addBlock}
      />
      
      <DojoCategory
        title="Events"
        icon={<FileText className="h-4 w-4" />}
        blocks={dojoBlocks.Event}
        addBlock={addBlock}
      />
      
      <h4 className="text-gray-400 font-medium">Token Actions</h4>
      <DojoCategory
        title="Systems/Contracts"
        icon={<Box className="h-4 w-4" />}
        blocks={dojoBlocks.Contract}
        addBlock={addBlock}
      />
    </div>
  );
}