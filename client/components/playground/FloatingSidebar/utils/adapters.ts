import { Code } from "lucide-react";
import { DojoBlock as ImportedDojoBlock } from "../../Dojo/types";
import { Block } from "../types";

export const dojoBlockAdapter = (dojoBlock: ImportedDojoBlock): Block => {
  return {
    id: dojoBlock.id,
    content: dojoBlock.title || dojoBlock.content || '', 
    color: dojoBlock.color || "bg-[#3C3C3C]", 
    borderColor: dojoBlock.borderColor || "border-[#6C6C6C]", 
    hoverBorderColor: dojoBlock.hoverBorderColor || "hover:border-[#9C9C9C]",
    icon: dojoBlock.icon || Code,
    code: dojoBlock.code || dojoBlock.description || '', 
  };
};