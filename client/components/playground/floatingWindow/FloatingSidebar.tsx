/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import CustomBlock from "../Modal/CustomBlock";
import groupedBlocks from "./data";
import { Code } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { toast } from 'sonner'

interface FloatingSidebarProps {
  addBlock: (block: any) => void;
}

export default function FloatingSidebar({ addBlock }: FloatingSidebarProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const formSchema = z.object({
    blockName: z.string().min(1, "Block name is required"),
    solidityCode: z.string().min(1, "Solidity code is required"),
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      solidityCode: "",
    },
  })
  return (
    <div className="flex max-w-36 max-h-[50rem] rounded-lg drop-shadow-2xl">
      <div className="bg-[#faf3dd] p-4 text-white rounded-xl ">
        <div className="mt-4">
          {Object.entries(groupedBlocks).map(([category, blocks]) => (
            <div key={category} className="mb-2">
              <h4 className="text-sm text-gray-800 my-4">{category}</h4>
              <div className="flex gap-4 flex-wrap">
                {blocks.map((block, index) => (
                  <button
                    key={index}
                    onClick={() => addBlock(block)}
                    className={`relative w-8 h-8 rounded flex items-center justify-center transition-colors text-gray-400 ${block.color} ${block.borderColor} ${block.hoverBorderColor} group hoverEffect`}
                  >
                    {<block.icon size="20" />}
                    {/* Tooltip */}
                    <div
                      className="absolute top-10 left-1/2 transform -translate-x-1/3 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none z-10"
                    >
                      {block.content}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <CustomBlock isOpen={isCustomModalOpen}
            onOpenChange={setIsCustomModalOpen}
            onSubmitCustomBlock={onSubmitCustomBlock}
          />
        </div>
      </div>

      <div className="flex-1 bg-gray-800">
        {/* <!-- Canvas content --> */}
      </div>
    </div>
  );

  function onSubmitCustomBlock(values: z.infer<typeof formSchema>) {
    const newCustomBlock = {
      id: 'custom',
      content: values.blockName,
      color: 'bg-[#3C3C3C]',
      borderColor: 'border-[#6C6C6C]',
      hoverBorderColor: 'hover:border-[#9C9C9C]',
      icon: Code,
      code: values.solidityCode,
    }

    addBlock(newCustomBlock)
    setIsCustomModalOpen(false)
    form.reset()
    toast.success('Custom block added successfully')
  }
};
