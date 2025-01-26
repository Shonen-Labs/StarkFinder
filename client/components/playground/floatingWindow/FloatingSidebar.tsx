/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import CustomBlock from "../Modal/CustomBlock";
import groupedBlocks from "./data";
import { Code } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { DIRTY, z } from "zod";
import { toast } from 'sonner'

// icons
import StartIcon from "@/components/svgs/StartIcon";
import CoinIcon from "@/components/svgs/CoinIcon";
import DropdownArrowIcon from "@/components/svgs/DropdownArrowIcon";
import SwapTokenIcon from "@/components/svgs/SwapTokenIcon";
import ToggleBtn from "@/components/svgs/ToggleBtn";
import StakeTokenIcon from "@/components/svgs/StakeTokenIcon";
import YieldFarmingIcon from "@/components/svgs/YieldFarmingIcon";
import AllocateTokenIcon from "@/components/svgs/AllocateTokenIcon";
import LendTokenIcon from "@/components/svgs/LendTokenIcon";
import BagIcon from "@/components/svgs/BagIcon"
import CubeIcon from "@/components/svgs/CubeIcon";
import LiquidDropIcon from "@/components/svgs/LiquidDropIcon"
import AddIcon from "@/components/svgs/AddIcon"
import AnalyticsIcon from "@/components/svgs/AnalyticsIcon";
import BorrowTokenIcon from "@/components/svgs/BorrowTokenIcon";
import ClockIcon from "@/components/svgs/ClockIcon";
import LossIcon from "@/components/svgs/LossIcon";
import PeopleIcon from "@/components/svgs/PeopleIcon";
import PieChartIcon from "@/components/svgs/PieChartIcon";
import ProfitIcon from "@/components/svgs/ProfitIcon";
import RepayLoanIcon from "@/components/svgs/RepayLoanIcon";
import RewardIcon from "@/components/svgs/RewardIcon";
import ScaleofJusticeIcon from "@/components/svgs/ScaleofJusticeICon";
import FlagIcon from "@/components/svgs/FlagIcon";
import ConnectionIcon from "@/components/svgs/ConnectionIcon";
import { TokensIcon } from "@radix-ui/react-icons";
import SetStrategyIcon from "@/components/svgs/SetStrategyIcon";
import PortfolioIcon from "@/components/svgs/PortfolioIcon";

// array holding data concerning  nested items 
const triggerActions = [{icon: <FlagIcon/>, text:"Initialise"}, {icon: <ConnectionIcon/>, text: "Connection"}];

const tokenActions  = [{icon: <SwapTokenIcon/>, text: "Swap Token"}, {icon: <StakeTokenIcon/>, text: "StakeToken"}, {icon:<AllocateTokenIcon/>, text: "Allocate Token"}, {icon: <YieldFarmingIcon/>, text: "Yield Farming"}, {icon: <LendTokenIcon/>, text: "Lend Tokens"}, {icon: <BorrowTokenIcon/>, text:"Borrow Token"}, {icon:<RepayLoanIcon/>, text:"Repay Loan"}];

const liquidityManagement  = [{icon: <AddIcon/>, text: "Add Liquidity"}, {icon: <PeopleIcon/>, text:"Create Stack Pooling"}]

const portfolioManagement = [{icon: <ClockIcon/>, text: "rebalance Portfolio"}, {icon: <ScaleofJusticeIcon/>, text:"Set Rebalance"},{icon: <CubeIcon/>, text: "Create Custom Index"},{icon: <LossIcon/>, text: "Set Stop Loss"},{icon: <ProfitIcon/>, text: "Set Take Profit"},{icon: <SetStrategyIcon/>, text: "Set Strategy"}]

const insighAndAnalytics =[{icon: <PieChartIcon/>, text: "Check Transaction"}, {icon: <PortfolioIcon/>, text:"Portfolio Analytics"}]


interface FloatingSidebarProps {
  addBlock: (block: any) => void;
}

export default function FloatingSidebar({ addBlock }: FloatingSidebarProps) {
  const[isOpen, setIsOpen] = useState(true)
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
      
        <div className="mt-4 flex flex-col gap-2 text-gray-400">
          <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>
                  <StartIcon/>
                </span>
                <div className="text-black">Trigger Actions</div>
              </div>
              <div>
                  <DropdownArrowIcon status=""/>
              </div>
          </div>
          {false && <div className="ml-10 mt-2 flex flex-col gap-2"></div>}
          <div>
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>
                  <CoinIcon/>
                </span>
                <div className="text-black">Token Actions</div>
              </div>
              <div className="text-gray-400">
                <DropdownArrowIcon status=""/>
              </div> 
            </div>
            {false && <div className="ml-10 mt-2 flex flex-col gap-2">
              <div className="px-3 py-2">
               {tokenActions.map(child=><div key={child.text} className="px-3 py-2">
                <div className="flex gap-3">
                  <span>{child.icon}</span>
                  <div className="text-black">{child.text}</div>
                </div>
              </div>)}
              </div>
            </div>}
            
          </div> 
        </div>

        {/* Assesment Management Section */}
        <div className="mt-8 text-gray-400">
          <h4>Assesment Management</h4>
          <div className="mt-4 flex flex-col gap-2">
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div className="text-black">Liquidity Management</div>
              </div>
              <div >
                <DropdownArrowIcon status=""/>
              </div> 
            </div>
            {false && 
              <div className="ml-10 mt-2 flex flex-col gap-2">
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Add Liquiduty</div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Create Stack Pooling</div>
                  </div>               
                </div>   
              </div>}
            <div className="px-3 py-2 flex justify-between items-center text-gray-400">
              <div className="flex gap-3">
                <span>icon</span>
                <div className="text-black">Portfolio Management</div>
              </div>
              <div>
                <DropdownArrowIcon status=""/>
              </div> 
            </div>
            {false && 
              <div className="ml-10 mt-2 flex flex-col gap-2">
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Rebalance Portfolio</div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Set Rebalance </div>
                  </div>  
                </div>
                <div className="px-3 py-2 ">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Create Custom Index</div>
                  </div>
                </div>
                <div className="px-3 py-2 flex justify-between items-center">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Set Stop Loss</div>
                  </div>
                </div>
                <div className="px-3 py-2 ">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Set Take Profit</div>
                  </div>               
                </div>
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Set Strategy</div>
                  </div>
                </div>
              </div>}
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div className="text-black">Insight & Analytics</div>
              </div>
              <div >
                <DropdownArrowIcon status=""/>
              </div> 
            </div>
            {false && 
                <div className="ml-10 mt-2 flex flex-col gap-2">
                  <div className="px-3 py-2">
                    <div className="flex gap-3">
                      <span>icon</span>
                      <div className="text-black">Add Liquiduty</div>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <div className="flex gap-3">
                      <span>icon</span>
                      <div className="text-black">Create Stack Pooling</div>
                    </div>               
                  </div>   
                </div>}
          </div>
        </div>
        
        {/* Token Action Section  */}
        <div className="mt-8 text-gray-400">
          <h4>Token Action</h4>
          <div className="mt-4 flex flex-col gap-2">
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div className="text-black">Governance</div>
              </div>
              <div>
                <DropdownArrowIcon status=""/>
              </div> 
            </div>
            {false &&
             <div className="ml-10 mt-2 flex flex-col gap-2">
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Vote on Proposal</div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Create Vesting</div>
                  </div>               
                </div>   
            </div>}
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>icon</span>
                <div className="text-black">Events & Automations</div>
              </div>
              <div>
                <DropdownArrowIcon status=""/>
              </div> 
            </div>
            {false &&
             <div className="ml-10 mt-2 flex flex-col gap-2">
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">On Event Outcome</div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Execute Flash Loan</div>
                  </div>               
                </div>   
                <div className="px-3 py-2">
                  <div className="flex gap-3">
                    <span>icon</span>
                    <div className="text-black">Initiate Airdrop</div>
                  </div>               
                </div> 
            </div>}
            <div className="px-3 py-2">
              <div className="flex gap-3">
                <span>icon</span>
                <div className="text-black">Custom</div>
              </div>      
            </div>
          </div>
        </div>

        <div className="mt-10 p-4 bg-[#104926] rounded-md text-white">
          <div>Take full control of your rewards! 🚀</div>
          <button className="mt-6 flex py-3 px-6 w-full gap-4 bg-[#F6FFFE] rounded-md text-[#297E71]">
            <span><RewardIcon/></span>
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
