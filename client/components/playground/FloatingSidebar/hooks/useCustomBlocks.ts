import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Code } from "lucide-react";
import { Block } from "../types";

const formSchema = z.object({
  blockName: z.string().min(1, "Block name is required"),
  cairoCode: z.string().min(1, "Cairo code is required"),
});

export const useCustomBlocks = (addBlock: (block: Block) => void) => {
  const [customBlocks, setCustomBlocks] = useState<Block[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      cairoCode: "",
    },
  });

  const onSubmitCustomBlock = (values: z.infer<typeof formSchema>) => {
    const newCustomBlock: Block = {
      id: `custom-${Date.now()}`,
      content: values.blockName,
      color: "bg-[#3C3C3C]",
      borderColor: "border-[#6C6C6C]",
      hoverBorderColor: "hover:border-[#9C9C9C]",
      icon: Code,
      code: values.cairoCode,
    };

    addBlock(newCustomBlock);
    setCustomBlocks((prevBlocks) => [...prevBlocks, newCustomBlock]);
    setIsCustomModalOpen(false);
    form.reset();
    toast.success("Custom block added successfully");
  };

  return {
    customBlocks,
    isCustomModalOpen,
    setIsCustomModalOpen,
    form,
    onSubmitCustomBlock,
  };
};
