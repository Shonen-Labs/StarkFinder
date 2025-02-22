/* eslint-disable react/jsx-key */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useReducer } from "react";
import groupedBlocks from "./data";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from 'sonner'
import { z } from 'zod'

// libraries
import clsx from 'clsx';

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
import SetStrategyIcon from "@/components/svgs/SetStrategyIcon";
import PortfolioIcon from "@/components/svgs/PortfolioIcon";
import PadlockIcon from "@/components/svgs/PadlockIcon";
import MarkedCalenderIcon from "@/components/svgs/MarkedCalenderIcon";
import EnergyIcon from "@/components/svgs/EnergyIcon";
import AirdropIcon from "@/components/svgs/AirdropIcon";
import GovernanceIcon from "@/components/svgs/GovernanceIcon";
import CalenderIcon from "@/components/svgs/CalenderIcon";
import MenuIcon from "@/components/svgs/MenuIcon";
import VoteIcon from "@/components/svgs/VoteIcon";
import { Code } from "lucide-react";

// array holding data concerning  nested items
interface FloatingSidebarProps {
  addBlock: (block: any) => void;
}
// const formSchema = z.object({
//   blockName: z.string().min(1, "Block name is required"),
//   solidityCode: z.string().min(1, "Solidity code is required"),
// })
const greg=groupedBlocks["Trigger Actions"]
const token=groupedBlocks["Token Actions"]
const li=groupedBlocks["Liquidity"]
const po=groupedBlocks["Portfolio Management"]
const inst=groupedBlocks["Analytics"]
const go=groupedBlocks["Governance"]
const ev=groupedBlocks["Events"]
const triggerActions = [{icon: <FlagIcon/>, text:"Initialise", toggle:false,groupedBlock:groupedBlocks["Trigger Actions"]}, {icon: <ConnectionIcon/>, text: "Connection", toggle:true,groupedBlock:groupedBlocks["Trigger Actions"]}];

const tokenActions  = [{icon: <SwapTokenIcon/>, text: "Swap Token", toggle:false}, {icon: <StakeTokenIcon/>, text: "StakeToken",  toggle:false}, {icon:<AllocateTokenIcon/>, text: "Allocate Token", toggle:false}, {icon: <YieldFarmingIcon/>, text: "Yield Farming", toggle:true}, {icon: <LendTokenIcon/>, text: "Lend Tokens", toggle:false}, {icon: <BorrowTokenIcon/>, text:"Borrow Token", toggle:false}, {icon:<RepayLoanIcon/>, text:"Repay Loan", toggle:false}];

const liquidityManagement  = [{icon: <AddIcon/>, text: "Add Liquidity"}, {icon: <PeopleIcon/>, text:"Create Stack Pooling"}]

const portfolioManagement = [{icon: <ClockIcon/>, text: "rebalance Portfolio"}, {icon: <ScaleofJusticeIcon/>, text:"Set Rebalance"},{icon: <CubeIcon/>, text: "Create Custom Index"},{icon: <LossIcon/>, text: "Set Stop Loss"},{icon: <ProfitIcon/>, text: "Set Take Profit"},{icon: <SetStrategyIcon/>, text: "Set Strategy"}]

const insighAndAnalytics =[{icon: <PieChartIcon/>, text: "Check Transaction"}, {icon: <PortfolioIcon/>, text:"Portfolio Analytics"}]

const governance = [{icon: <VoteIcon/>, text: "Vote on Proposal"}, {icon: <PadlockIcon/>, text:"Create Vesting"}]

const eventsAndAutomation = [{icon: <MarkedCalenderIcon/>, text: "On Event Outcome"}, {icon: <EnergyIcon/>, text:"Execute Flash Loan"},{icon: <AirdropIcon/>, text: "Initiate Airdrop"}]

interface FloatingSidebarProps {
  addBlock: (block: any) => void;
}

interface ToggleState {
  triggerActionToggle: boolean,
  tokenActionsToggle: boolean,
  liquidityManagementToggle: boolean,
  portfolioManagementToggle: boolean,
  insightAndAnalyticsToggle: boolean,
  governanceToggle: boolean,
  eventsAndAutomationToggle: boolean
}

type ToggleAction =
  | { type: "toggle_triggerAction" }
  | { type: "toggle_tokenActions" }
  | { type: "toggle_liquidityManagement" }
  | { type: "toggle_portfolioManagement" }
  | { type: "toggle_insightAndAnalytics" }
  | { type: "toggle_governance" }
  | { type: "toggle_eventsAndAutomation" }

const initialState = {
  triggerActionToggle: false,
  tokenActionsToggle: false,
  liquidityManagementToggle: false,
  portfolioManagementToggle: false,
  insightAndAnalyticsToggle: false,
  governanceToggle: false,
  eventsAndAutomationToggle: false
}
const combined = triggerActions.map((action, index) => ({
  ...action,
  block: greg[index],
}));


function toggleReducer(state: ToggleState, action:ToggleAction ): ToggleState {
  switch (action.type) {
    case "toggle_triggerAction":
      return { ...initialState, triggerActionToggle: !state.triggerActionToggle };
    case "toggle_tokenActions":
      return { ...initialState, tokenActionsToggle: !state.tokenActionsToggle};
    case "toggle_liquidityManagement":
      return { ...initialState, liquidityManagementToggle: !state.liquidityManagementToggle};
    case "toggle_portfolioManagement": 
      return { ...initialState, portfolioManagementToggle: !state.portfolioManagementToggle }
    case "toggle_insightAndAnalytics":
      return { ...initialState, insightAndAnalyticsToggle: !state.insightAndAnalyticsToggle };
    case "toggle_governance":
      return { ...initialState, governanceToggle: !state.governanceToggle};
    case "toggle_eventsAndAutomation":
      return { ...initialState, eventsAndAutomationToggle: !state.eventsAndAutomationToggle };
    default:
      return initialState;
  }
}

interface CustomBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { blockName: string; cairoCode: string }) => void;
}

const formSchema = z.object({
  blockName: z.string().min(1, "Block name is required"),
  cairoCode: z.string().min(1, "Cairo code is required"),
});

function CustomBlockModal({ isOpen, onClose, onSubmit }: CustomBlockModalProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      cairoCode: "",
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-4">Create Custom Block</h2>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Block Name</label>
            <input
              {...form.register("blockName")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {form.formState.errors.blockName && (
              <p className="text-red-500 text-sm">{form.formState.errors.blockName.message}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Cairo Code</label>
            <textarea
              {...form.register("cairoCode")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={4}
            />
            {form.formState.errors.cairoCode && (
              <p className="text-red-500 text-sm">{form.formState.errors.cairoCode.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FloatingSidebar({ addBlock }: FloatingSidebarProps) {
  const [{triggerActionToggle,
    tokenActionsToggle,
    liquidityManagementToggle,
    portfolioManagementToggle,
    insightAndAnalyticsToggle,
    governanceToggle,
    eventsAndAutomationToggle}, dispatch] = useReducer(toggleReducer, initialState);

  const [onToggleButton, setOnToggleButton] = useState(false);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  function switchToggleBtn(){
    setOnToggleButton((prev)=> !prev)
    console.log("print")
  }

  const formSchema = z.object({
    blockName: z.string().min(1, "Block name is required"),
    cairoCode: z.string().min(1, "Cairo code is required"),
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      cairoCode: "",
    },
  })
  return (
    <div className="w-[300px] bg-white px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ease-out mb-5 text-sm">
      {/* Defi Section */}
      <div>
        <h4 className="text-gray-400">Defi</h4>
      
        <div className="mt-4 flex flex-col gap-2 text-gray-400">
          <div className={clsx("hover:bg-gray-200 rounded-lg", triggerActionToggle && 'bg-gray-200')}>
            <div className="px-3 py-2 flex justify-between items-center">
                <div className="flex gap-3">
                  <span>
                    <StartIcon/>
                  </span>
                  <div className="text-black">Trigger Actions</div>
                </div>
                <div onClick={() => dispatch({ type: "toggle_triggerAction" })}>
                  {triggerActionToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>} 
                </div>
            </div>
            {triggerActionToggle && <div className="ml-10 my-2 mr-2 flex flex-col gap-2">
              {combined.map((item) => (
      <div 
        key={item.text}  // ensure key is unique; consider using a unique id if available
        className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
      >
        <div 
          className="flex justify-between items-center"
          onClick={() => item.block && addBlock(item.block)}  // only call addBlock if block exists
        >
          <div className="flex gap-3">
            <span>{item.icon}</span>
            <div className="text-black hover:font-medium">{item.text}</div>
          </div>
          <span>
            {item.toggle && (
              onToggleButton ? (
                <ToggleBtn mode="on" onClick={switchToggleBtn} />
              ) : (
                <ToggleBtn mode="off" onClick={switchToggleBtn} />
              )
            )}
          </span>
        </div>
        {/* If you need to render extra details from the block */}
        {/*item.block && ()*/}
      </div>
    ))}

              </div>}
          </div>
          <div className={clsx("hover:bg-gray-200 rounded-lg", tokenActionsToggle && 'bg-gray-200')}>
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="flex gap-3">
                <span>
                  <CoinIcon/>
                </span>
                <div className="text-black ">Token Actions</div>
              </div>
              <div onClick={() => dispatch({ type: "toggle_tokenActions" })}>
               {tokenActionsToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>} 
              </div> 
            </div>
            {tokenActionsToggle && (
  <div className="ml-10 my-2 flex flex-col gap-2 cursor-pointer">
    {tokenActions.map((child, index) => {
      // Get the corresponding token item by index.
      const block = token[index];
      
      return (
        <div
          key={child.text} // Consider using a unique identifier if available
          className="px-3 py-2 hover:bg-gray-100 rounded-md mr-2"
        >
          <div className="flex justify-between items-center" onClick={() => block && addBlock(block)}>
            <div className="flex gap-3">
              <span>{child.icon}</span>
              <div className="text-black hover:font-medium">{child.text}</div>
            </div>
            <span>
              {child.toggle &&
                (onToggleButton ? (
                  <ToggleBtn mode="on" onClick={switchToggleBtn} />
                ) : (
                  <ToggleBtn mode="off" onClick={switchToggleBtn} />
                ))}
            </span>
          </div>

          {/* Render details from the corresponding token item if needed */}
          {/*block && (
          
          )*/}
        </div>
      );
    })}
  </div>
)}

          </div>
        </div>

        {/* Assesment Management Section */}
        <div className="mt-8 text-gray-400">
          <h4>Assesment Management</h4>
          <div className="mt-4 flex flex-col gap-2">
          <div className={clsx("hover:bg-gray-200 rounded-lg", liquidityManagementToggle && 'bg-gray-200')}>
              <div className="px-3 py-2 flex justify-between items-center">
                  <div className="flex gap-3">
                    <span><LiquidDropIcon/></span>
                    <div className="text-black">Liquidity Management</div>
                  </div>
                  <div onClick={() => dispatch({ type: "toggle_liquidityManagement" })}>
                      {liquidityManagementToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>} 
                  </div> 
                </div>
                {liquidityManagementToggle && 
                  <div className="ml-10 my-2 flex flex-col gap-2">
                    {liquidityManagement.map((child,index) => {
                      const block = li[index];
                      return(
                    <div className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2" key={child.text}>
                      
                      <div className="flex gap-3" onClick={() => block && addBlock(block)}>
                        <span>{child.icon}</span>
                        <div className="text-black">{child.text}</div>
                      </div>
                    </div>)})}   
                  </div>}
            </div>
          
            <div className={clsx("hover:bg-gray-200 rounded-lg", portfolioManagementToggle && 'bg-gray-200')}>
              <div className="px-3 py-2 flex justify-between items-center text-gray-400">
                <div className="flex gap-3">
                  <span><BagIcon/></span>
                  <div className="text-black">Portfolio Management</div>
                </div>
                <div onClick={() => dispatch({ type: "toggle_portfolioManagement" })}>
                  {portfolioManagementToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>}
                </div> 
              </div>
              {portfolioManagementToggle && 
                <div className="ml-10 my-2 flex flex-col gap-2">
                  {portfolioManagement.map((child,index)=>{
                    const block = po[index];
                     return(
                     <div className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2">
                    <div className="flex gap-3" onClick={() => block && addBlock(block)}>
                      <span>{child.icon}</span>
                      <div className="text-black">{child.text}</div>
                    </div>
                  </div>)})}
                </div>}
            </div>

            <div className={clsx("hover:bg-gray-200 rounded-lg", insightAndAnalyticsToggle && 'bg-gray-200')}>
              <div className="px-3 py-2 flex justify-between items-center">
                  <div className="flex gap-3">
                    <span><AnalyticsIcon/></span>
                    <div className="text-black">Insight & Analytics</div>
                  </div>
                    <div onClick={() => dispatch({ type: "toggle_insightAndAnalytics"})}>
                    {insightAndAnalyticsToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>}
                  </div> 
                </div>
                {insightAndAnalyticsToggle && 
                    <div className="ml-10 my-2 flex flex-col gap-2">
                      {insighAndAnalytics.map((child,index) =>{ 
                        const block = inst[index];
                        return(
                         <div className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2">
                        <div className="flex gap-3"onClick={() => block && addBlock(block)}>
                          <span>{child.icon}</span>
                          <div className="text-black">{child.text}</div>
                        </div>
                      </div>)})}    
                  </div>}
              </div>
            </div>
        </div>
        
        {/* Token Action Section  */}
        <div className="mt-8 text-gray-400">
          <h4>Token Action</h4>
          <div className="mt-4 flex flex-col gap-2">
            <div className={clsx("hover:bg-gray-200 rounded-lg", governanceToggle && 'bg-gray-200')}>
              <div className="px-3 py-2 flex justify-between items-center">
                <div className="flex gap-3">
                  <span><GovernanceIcon/></span>
                  <div className="text-black">Governance</div>
                </div>
                <div onClick={() => dispatch({ type: "toggle_governance"})}>
                  {governanceToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>}
                </div> 
              </div>
              {governanceToggle &&
              <div className="ml-10 my-2 flex flex-col gap-2">
                {governance.map((child,index)=>{
                   const block = go[index];
                  return(
                <div className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2">
                    <div className="flex gap-3" onClick={() => block && addBlock(block)}>
                      <span>{child.icon}</span>
                      <div className="text-black">{child.text}</div>
                    </div>
                  </div>)})}  
              </div>}
            </div>

            <div className={clsx("hover:bg-gray-200 rounded-lg", eventsAndAutomationToggle && 'bg-gray-200')}>
              <div className="px-3 py-2 flex justify-between items-center">
                <div className="flex gap-3">
                  <span><CalenderIcon/></span>
                  <div className="text-black">Events & Automations</div>
                </div>
                <div onClick={() => dispatch({ type: "toggle_eventsAndAutomation"})}>
                {eventsAndAutomationToggle? <DropdownArrowIcon status="open"/>: <DropdownArrowIcon status="closed"/>}
                </div> 
              </div>
              {eventsAndAutomationToggle &&
              <div className="ml-10 my-2 flex flex-col gap-2">
                {eventsAndAutomation.map((child,index)=>{
                  const block = ev[index];
                  return(
                  <div className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2">
                    <div className="flex gap-3" onClick={() => block && addBlock(block)}>
                      <span>{child.icon}</span>
                      <div className="text-black">{child.text}</div>
                    </div>
                  </div>)})}
              </div>}
            </div>
            
            <div className="px-3 py-2 cursor-pointer" onClick={() => setIsCustomModalOpen(true)}>
            <div className="flex gap-3">
              <span><MenuIcon /></span>
              <div className="text-black">Custom</div>
            </div>
          </div>
          </div>
        </div>

        <div className="mt-10 p-4 bg-[#104926] rounded-md text-white">
          <div>Take full control of your rewards! 🚀</div>
          <button className="mt-6 flex py-3 px-6 w-full gap-4 bg-[#F6FFFE] rounded-md text-[#297E71] shadow-sm transition transform hover:hover:bg-opacity-80 hover:shadow-md active:shadow-lg active:scale-95 ease-out">
            <span><RewardIcon/></span>
            <div>Claim Token</div>
          </button>
        </div>
      </div>

      <CustomBlockModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={onSubmitCustomBlock}
      />
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
      code: values.cairoCode,
    }
  
    addBlock(newCustomBlock)
    setIsCustomModalOpen(false)
    form.reset()
    toast.success('Custom block added successfully')}
  }