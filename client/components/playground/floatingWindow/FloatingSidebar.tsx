/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CustomBlock from "../Modal/CustomBlock";
import groupedBlocks from "./data";
import { Code } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { DIRTY, z } from "zod";
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
    <div className="w-[300px] bg-white px-6 py-4 rounded-lg shadow-lg">
      {/* Defi Section */}
      <div>
        <h4 className="text-gray-400">Defi</h4>
      
        <div className="mt-4 flex flex-col gap-2">
          <div className="px-3 py-2 flex justify-between items-center">
            <div className="flex gap-3">
              <span>icon</span>
              <div>Trigger Actions</div>
            </div>
            <ChevronDown/>
          </div>
          <div>
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Token Actions</div>
              </div>
              <ChevronDown/>
            </div>
            <div className="ml-10 mt-2 flex flex-col gap-2">
              <div className="px-3 py-2">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Swap Token</div>
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Stake Token </div>
                </div>
                
              </div>
              <div className="px-3 py-2 ">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Allocate Token</div>
                </div>
              </div>
              <div className="px-3 py-2 flex justify-between items-center">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Yield Farming</div>
                </div>
                <ChevronDown/>
              </div>
              <div className="px-3 py-2 ">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Lend Tokens</div>
                </div>               
              </div>
              <div className="px-3 py-2">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Borrow Token</div>
                </div>
              </div>
              <div className="px-3 py-2 ">
                <div className="flex gap-3">
                  <span>icon</span>
                  <div>Repay Loan</div>
                </div>  
              </div>
            </div>
          </div> 
        </div>

        {/* Assesment Management Section */}
        <div className="mt-8">
          <h4 className="text-gray-400">Assesment Management</h4>
          <div className="mt-4 flex flex-col gap-2">
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Liquidity Management</div>
              </div>
              <ChevronDown/>
            </div>
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Portfolio Management</div>
              </div>
              <ChevronDown/>
            </div>
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Insight & Analytics</div>
              </div>
              <ChevronDown/>
            </div>
          </div>
        </div>
        
        {/* Token Action Section  */}
        <div className="mt-8">
          <h4 className="text-gray-400">Token Action</h4>
          <div className="mt-4 flex flex-col gap-2">
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Governance</div>
              </div>
              <ChevronDown/>
            </div>
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Events & Automations</div>
              </div>
              <ChevronDown/>
            </div>
            <div className="px-3 py-2">
              <div className="flex gap-3">
                <span>icon</span>
                <div>Custom</div>
              </div>
             
            </div>
          </div>
        </div>

        <div className="mt-10 p-4 bg-[#104926] rounded-md text-white">
          <div>Take full control of your rewards! 🚀</div>
          <button className="mt-6 flex py-3 px-6 w-full gap-4 bg-[#F6FFFE] rounded-md text-[#297E71]">
            <span>icon</span>
            <div>Claim Token</div>
          </button>
        </div>
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
