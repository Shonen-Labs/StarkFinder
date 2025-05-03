"use client";

import { useState, useReducer, useEffect, useRef, ComponentType, SVGProps } from "react";
import groupedBlocks from "./data";

// import dojoBlocks from "../Dojo/DojoBlocks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import clsx from "clsx";
import Link from "next/link";
import { Code } from "lucide-react";

// Components
import EnvironmentSwitch from "../Dojo/EnvironmentSwitch";
import DojoBlocksSidebar from "../Dojo/DojoBlocksSidebar";
import CustomBlockModal from "../Modal/CustomBlock";
// Import the DojoBlock type from your types file, but rename it to avoid conflict
import { DojoBlock as ImportedDojoBlock } from "../Dojo/types";

// Icons
import StartIcon from "@/components/svgs/StartIcon";
import CoinIcon from "@/components/svgs/CoinIcon";
import DropdownArrowIcon from "@/components/svgs/DropdownArrowIcon";
import SwapTokenIcon from "@/components/svgs/SwapTokenIcon";
import ToggleBtn from "@/components/svgs/ToggleBtn";
import StakeTokenIcon from "@/components/svgs/StakeTokenIcon";
import YieldFarmingIcon from "@/components/svgs/YieldFarmingIcon";
import AllocateTokenIcon from "@/components/svgs/AllocateTokenIcon";
import LendTokenIcon from "@/components/svgs/LendTokenIcon";
import BagIcon from "@/components/svgs/BagIcon";
import CubeIcon from "@/components/svgs/CubeIcon";
import LiquidDropIcon from "@/components/svgs/LiquidDropIcon";
import AddIcon from "@/components/svgs/AddIcon";
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

// Prepare grouped blocks references
const greg = groupedBlocks["Trigger Actions"];
const token = groupedBlocks["Token Actions"];
const li = groupedBlocks["Liquidity"];
const po = groupedBlocks["Portfolio Management"];
const inst = groupedBlocks["Analytics"];
const go = groupedBlocks["Governance"];
const ev = groupedBlocks["Events"];

// Define an IconType for SVG components
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// Define a Block type to replace 'any'
interface Block {
  id: string;
  content: string;
  color: string;
  borderColor: string;
  hoverBorderColor: string;
  icon: IconType;
  code?: string;
}

// Define a local DojoBlock interface to avoid conflict with imported one
// interface DojoBlock {
//   id: string;
//   title: string;
//   description?: string;
//   color?: string;
//   borderColor?: string;
//   hoverBorderColor?: string;
//   icon?: IconType;
//   code?: string;
// }

const dojoBlockAdapter = (dojoBlock: ImportedDojoBlock): Block => {
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

// Menu item data
const triggerActions = [
  {
    icon: <FlagIcon />,
    text: "Initialise",
    toggle: false,
    groupedBlock: groupedBlocks["Trigger Actions"],
  },
  {
    icon: <ConnectionIcon />,
    text: "Connection",
    toggle: true,
    groupedBlock: groupedBlocks["Trigger Actions"],
  },
];

const tokenActions = [
  { icon: <SwapTokenIcon />, text: "Swap Token", toggle: false },
  { icon: <StakeTokenIcon />, text: "StakeToken", toggle: false },
  { icon: <AllocateTokenIcon />, text: "Allocate Token", toggle: false },
  { icon: <YieldFarmingIcon />, text: "Yield Farming", toggle: true },
  { icon: <LendTokenIcon />, text: "Lend Tokens", toggle: false },
  { icon: <BorrowTokenIcon />, text: "Borrow Token", toggle: false },
  { icon: <RepayLoanIcon />, text: "Repay Loan", toggle: false },
];

const liquidityManagement = [
  { icon: <AddIcon />, text: "Add Liquidity" },
  { icon: <PeopleIcon />, text: "Create Stack Pooling" },
];

const portfolioManagement = [
  { icon: <ClockIcon />, text: "rebalance Portfolio" },
  { icon: <ScaleofJusticeIcon />, text: "Set Rebalance" },
  { icon: <CubeIcon />, text: "Create Custom Index" },
  { icon: <LossIcon />, text: "Set Stop Loss" },
  { icon: <ProfitIcon />, text: "Set Take Profit" },
  { icon: <SetStrategyIcon />, text: "Set Strategy" },
];

const insighAndAnalytics = [
  { icon: <PieChartIcon />, text: "Check Transaction" },
  { icon: <PortfolioIcon />, text: "Portfolio Analytics" },
];

const governance = [
  { icon: <VoteIcon />, text: "Vote on Proposal" },
  { icon: <PadlockIcon />, text: "Create Vesting" },
];

const eventsAndAutomation = [
  { icon: <MarkedCalenderIcon />, text: "On Event Outcome" },
  { icon: <EnergyIcon />, text: "Execute Flash Loan" },
  { icon: <AirdropIcon />, text: "Initiate Airdrop" },
];

interface FloatingSidebarProps {
  addBlock: (block: Block) => void;
}

interface ToggleState {
  triggerActionToggle: boolean;
  tokenActionsToggle: boolean;
  liquidityManagementToggle: boolean;
  portfolioManagementToggle: boolean;
  insightAndAnalyticsToggle: boolean;
  governanceToggle: boolean;
  eventsAndAutomationToggle: boolean;
}

type ToggleAction =
  | { type: "toggle_triggerAction" }
  | { type: "toggle_tokenActions" }
  | { type: "toggle_liquidityManagement" }
  | { type: "toggle_portfolioManagement" }
  | { type: "toggle_insightAndAnalytics" }
  | { type: "toggle_governance" }
  | { type: "toggle_eventsAndAutomation" };

const initialState = {
  triggerActionToggle: false,
  tokenActionsToggle: false,
  liquidityManagementToggle: false,
  portfolioManagementToggle: false,
  insightAndAnalyticsToggle: false,
  governanceToggle: false,
  eventsAndAutomationToggle: false,
};

function toggleReducer(state: ToggleState, action: ToggleAction): ToggleState {
  switch (action.type) {
    case "toggle_triggerAction":
      return {
        ...initialState,
        triggerActionToggle: !state.triggerActionToggle,
      };
    case "toggle_tokenActions":
      return { ...initialState, tokenActionsToggle: !state.tokenActionsToggle };
    case "toggle_liquidityManagement":
      return {
        ...initialState,
        liquidityManagementToggle: !state.liquidityManagementToggle,
      };
    case "toggle_portfolioManagement":
      return {
        ...initialState,
        portfolioManagementToggle: !state.portfolioManagementToggle,
      };
    case "toggle_insightAndAnalytics":
      return {
        ...initialState,
        insightAndAnalyticsToggle: !state.insightAndAnalyticsToggle,
      };
    case "toggle_governance":
      return { ...initialState, governanceToggle: !state.governanceToggle };
    case "toggle_eventsAndAutomation":
      return {
        ...initialState,
        eventsAndAutomationToggle: !state.eventsAndAutomationToggle,
      };
    default:
      return initialState;
  }
}

const combined = triggerActions.map((action, index) => ({
  ...action,
  block: greg[index],
}));

export default function FloatingSidebar({ addBlock }: FloatingSidebarProps) {
  const [environment, setEnvironment] = useState<"starknet" | "dojo">(
    "starknet"
  );
  const [state, dispatch] = useReducer(toggleReducer, initialState);
  const [onToggleButton, setOnToggleButton] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customBlocks, setCustomBlocks] = useState<Block[]>([]);
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null);
  const starknetRef = useRef<HTMLDivElement>(null);

  const formSchema = z.object({
    blockName: z.string().min(1, "Block name is required"),
    cairoCode: z.string().min(1, "Cairo code is required"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      cairoCode: "",
    },
  });

  // Save the starknet sidebar height when component mounts
  useEffect(() => {
    if (starknetRef.current && environment === "starknet") {
      setSidebarHeight(starknetRef.current.scrollHeight);
    }
  }, [environment]);

  function switchToggleBtn() {
    setOnToggleButton((prev) => !prev);
  }

  function handleEnvironmentChange(newEnvironment: "starknet" | "dojo") {
    setEnvironment(newEnvironment);
  }

  function onSubmitCustomBlock(values: z.infer<typeof formSchema>) {
    // Create a custom block with the same structure as other blocks
    const newCustomBlock: Block = {
      id: `custom-${Date.now()}`, // Generate a unique ID
      content: values.blockName,
      color: "bg-[#3C3C3C]",
      borderColor: "border-[#6C6C6C]",
      hoverBorderColor: "hover:border-[#9C9C9C]",
      icon: Code,
      code: values.cairoCode,
    };

    // Add the new block to both the interface and store it
    addBlock(newCustomBlock);

    // Store the custom block in our local state to display in the sidebar
    setCustomBlocks((prevBlocks) => [...prevBlocks, newCustomBlock]);

    setIsCustomModalOpen(false);
    form.reset();
    toast.success("Custom block added successfully");
  }

  // Create dynamic styles for the main container based on environment
  const sidebarStyle =
    environment === "dojo" && sidebarHeight
      ? { minHeight: `${sidebarHeight}px` }
      : {};

  return (
    <div
      className="w-[300px] bg-white px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ease-out mb-5 text-sm"
      style={sidebarStyle}
    >
      {/* Environment Switch */}
      <EnvironmentSwitch
        onChange={handleEnvironmentChange}
        defaultEnvironment="starknet"
      />

      {/* Render Either Starknet or Dojo Blocks based on environment */}
      {environment === "starknet" ? (
        <div ref={starknetRef}>
          {/* Defi Section */}
          <div>
            <h4 className="text-gray-400">Defi</h4>

            <div className="mt-4 flex flex-col gap-2 text-gray-400">
              <div
                className={clsx(
                  "hover:bg-gray-200 rounded-lg",
                  state.triggerActionToggle && "bg-gray-200"
                )}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "toggle_triggerAction" });
                  }}
                  className="px-3 py-2 flex justify-between items-center"
                >
                  <div className="flex gap-3">
                    <span>
                      <StartIcon />
                    </span>
                    <div className="text-black cursor-default">
                      Trigger Actions
                    </div>
                  </div>
                  <div>
                    {state.triggerActionToggle ? (
                      <DropdownArrowIcon status="open" />
                    ) : (
                      <DropdownArrowIcon status="closed" />
                    )}
                  </div>
                </div>

                {state.triggerActionToggle && (
                  <div className="ml-10 my-2 mr-2 flex flex-col gap-2">
                    {combined.map((item) => (
                      <div
                        key={item.text}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
                      >
                        <div
                          className="flex justify-between items-center"
                          onClick={() => item.block && addBlock(item.block)}
                        >
                          <div className="flex gap-3">
                            <span>{item.icon}</span>
                            <div className="text-black hover:font-medium">
                              {item.text}
                            </div>
                          </div>
                          <span>
                            {item.toggle &&
                              (onToggleButton ? (
                                <ToggleBtn
                                  mode="on"
                                  onClick={switchToggleBtn}
                                />
                              ) : (
                                <ToggleBtn
                                  mode="off"
                                  onClick={switchToggleBtn}
                                />
                              ))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={clsx(
                  "hover:bg-gray-200 rounded-lg",
                  state.tokenActionsToggle && "bg-gray-200"
                )}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "toggle_tokenActions" });
                  }}
                  className="px-3 py-2 flex justify-between items-center"
                >
                  <div className="flex gap-3">
                    <span>
                      <CoinIcon />
                    </span>
                    <div className="text-black cursor-default">
                      Token Actions
                    </div>
                  </div>
                  <div>
                    {state.tokenActionsToggle ? (
                      <DropdownArrowIcon status="open" />
                    ) : (
                      <DropdownArrowIcon status="closed" />
                    )}
                  </div>
                </div>

                {state.tokenActionsToggle && (
                  <div className="ml-10 my-2 flex flex-col gap-2 cursor-pointer">
                    {tokenActions.map((child, index) => {
                      // Get the corresponding token item by index.
                      const block = token[index];

                      return (
                        <div
                          key={child.text}
                          className="px-3 py-2 hover:bg-gray-100 rounded-md mr-2"
                        >
                          <div
                            className="flex justify-between items-center"
                            onClick={() => block && addBlock(block)}
                          >
                            <div className="flex gap-3">
                              <span>{child.icon}</span>
                              <div className="text-black hover:font-medium">
                                {child.text}
                              </div>
                            </div>
                            <span>
                              {child.toggle &&
                                (onToggleButton ? (
                                  <ToggleBtn
                                    mode="on"
                                    onClick={switchToggleBtn}
                                  />
                                ) : (
                                  <ToggleBtn
                                    mode="off"
                                    onClick={switchToggleBtn}
                                  />
                                ))}
                            </span>
                          </div>
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
                <div
                  className={clsx(
                    "hover:bg-gray-200 rounded-lg",
                    state.liquidityManagementToggle && "bg-gray-200"
                  )}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "toggle_liquidityManagement" });
                    }}
                    className="px-3 py-2 flex justify-between items-center"
                  >
                    <div className="flex gap-3">
                      <span>
                        <LiquidDropIcon />
                      </span>
                      <div className="text-black cursor-default">
                        Liquidity Management
                      </div>
                    </div>
                    <div>
                      {state.liquidityManagementToggle ? (
                        <DropdownArrowIcon status="open" />
                      ) : (
                        <DropdownArrowIcon status="closed" />
                      )}
                    </div>
                  </div>

                  {state.liquidityManagementToggle && (
                    <div className="ml-10 my-2 flex flex-col gap-2">
                      {liquidityManagement.map((child, index) => {
                        const block = li[index];
                        return (
                          <div
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
                            key={child.text}
                          >
                            <div
                              className="flex gap-3"
                              onClick={() => block && addBlock(block)}
                            >
                              <span>{child.icon}</span>
                              <div className="text-black">{child.text}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className={clsx(
                    "hover:bg-gray-200 rounded-lg",
                    state.portfolioManagementToggle && "bg-gray-200"
                  )}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "toggle_portfolioManagement" });
                    }}
                    className="px-3 py-2 flex justify-between items-center text-gray-400"
                  >
                    <div className="flex gap-3">
                      <span>
                        <BagIcon />
                      </span>
                      <div className="text-black cursor-default">
                        Portfolio Management
                      </div>
                    </div>
                    <div>
                      {state.portfolioManagementToggle ? (
                        <DropdownArrowIcon status="open" />
                      ) : (
                        <DropdownArrowIcon status="closed" />
                      )}
                    </div>
                  </div>

                  {state.portfolioManagementToggle && (
                    <div className="ml-10 my-2 flex flex-col gap-2">
                      {portfolioManagement.map((child, index) => {
                        const block = po[index];
                        return (
                          <div
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
                            key={child.text}
                          >
                            <div
                              className="flex gap-3"
                              onClick={() => block && addBlock(block)}
                            >
                              <span>{child.icon}</span>
                              <div className="text-black">{child.text}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className={clsx(
                    "hover:bg-gray-200 rounded-lg",
                    state.insightAndAnalyticsToggle && "bg-gray-200"
                  )}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "toggle_insightAndAnalytics" });
                    }}
                    className="px-3 py-2 flex justify-between items-center"
                  >
                    <div className="flex gap-3">
                      <span>
                        <AnalyticsIcon />
                      </span>
                      <div className="text-black cursor-default">
                        Insight & Analytics
                      </div>
                    </div>
                    <div>
                      {state.insightAndAnalyticsToggle ? (
                        <DropdownArrowIcon status="open" />
                      ) : (
                        <DropdownArrowIcon status="closed" />
                      )}
                    </div>
                  </div>

                  {state.insightAndAnalyticsToggle && (
                    <div className="ml-10 my-2 flex flex-col gap-2">
                      {insighAndAnalytics.map((child, index) => {
                        const block = inst[index];
                        return (
                          <div
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
                            key={child.text}
                          >
                            <div
                              className="flex gap-3"
                              onClick={() => block && addBlock(block)}
                            >
                              <span>{child.icon}</span>
                              <div className="text-black">{child.text}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Token Action Section  */}
            <div className="mt-8 text-gray-400">
              <h4>Token Action</h4>

              <div className="mt-4 flex flex-col gap-2">
                <div
                  className={clsx(
                    "hover:bg-gray-200 rounded-lg",
                    state.governanceToggle && "bg-gray-200"
                  )}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "toggle_governance" });
                    }}
                    className="px-3 py-2 flex justify-between items-center"
                  >
                    <div className="flex gap-3">
                      <span>
                        <GovernanceIcon />
                      </span>
                      <div className="text-black cursor-default">
                        Governance
                      </div>
                    </div>
                    <div>
                      {state.governanceToggle ? (
                        <DropdownArrowIcon status="open" />
                      ) : (
                        <DropdownArrowIcon status="closed" />
                      )}
                    </div>
                  </div>

                  {state.governanceToggle && (
                    <div className="ml-10 my-2 flex flex-col gap-2">
                      {governance.map((child, index) => {
                        const block = go[index];
                        return (
                          <div
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
                            key={child.text}
                          >
                            <div
                              className="flex gap-3"
                              onClick={() => block && addBlock(block)}
                            >
                              <span>{child.icon}</span>
                              <div className="text-black">{child.text}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className={clsx(
                    "hover:bg-gray-200 rounded-lg",
                    state.eventsAndAutomationToggle && "bg-gray-200"
                  )}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "toggle_eventsAndAutomation" });
                    }}
                    className="px-3 py-2 flex justify-between items-center"
                  >
                    <div className="flex gap-3">
                      <span>
                        <CalenderIcon />
                      </span>
                      <div className="text-black cursor-default">
                        Events & Automations
                      </div>
                    </div>
                    <div>
                      {state.eventsAndAutomationToggle ? (
                        <DropdownArrowIcon status="open" />
                      ) : (
                        <DropdownArrowIcon status="closed" />
                      )}
                    </div>
                  </div>

                  {state.eventsAndAutomationToggle && (
                    <div className="ml-10 my-2 flex flex-col gap-2">
                      {eventsAndAutomation.map((child, index) => {
                        const block = ev[index];
                        return (
                          <div
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
                            key={child.text}
                          >
                            <div
                              className="flex gap-3"
                              onClick={() => block && addBlock(block)}
                            >
                              <span>{child.icon}</span>
                              <div className="text-black">{child.text}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <DojoBlocksSidebar
            addBlock={(dojoBlock) => {
              const convertedBlock = dojoBlockAdapter(dojoBlock);
              addBlock(convertedBlock);
            }}
          />

          <div className="flex-grow"></div>
        </div>
      )}

      {/* Custom Block Section */}
      <div className="mt-4">
        <div className="hover:bg-gray-200 rounded-lg">
          <div
            onClick={() => setIsCustomModalOpen(true)}
            className="px-3 py-2 flex justify-between items-center cursor-pointer"
          >
            <div className="flex gap-3">
              <span>
                <MenuIcon />
              </span>
              <div className="text-black">Custom</div>
            </div>
            <div>
              <Code className="h-4 w-4 text-gray-500" />
            </div>
          </div>

          {/* Display custom blocks if any */}
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
                      <span>
                        <Code className="h-4 w-4" />
                      </span>
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


      {/* Promotional Section */}
      <div className="mt-10 p-4 bg-[#104926] rounded-md text-white">
        <div>Take full control of your rewards! 🚀</div>
        <button className="mt-6 flex py-3 px-6 w-full gap-4 bg-[#F6FFFE] rounded-md text-[#297E71] shadow-sm transition transform hover:hover:bg-opacity-80 hover:shadow-md active:shadow-lg active:scale-95 ease-out">
          <span>
            <RewardIcon />
          </span>
          <div>Claim Token</div>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="mt-4">
        <Link
          href="/devx/contracts"
          className="inline-flex justify-center py-3 w-full text-sm rounded-md bg-neutral-50 hover:bg-gray-200 font-medium"
        >
          Contracts
        </Link>
      </div>
      <Link
        href="/devx/resources"
        className="inline-flex justify-center py-3 w-full text-sm rounded-md bg-neutral-50 hover:bg-gray-200 font-medium"
      >
        Resources
      </Link>

      {/* Custom Block Modal */}
      <CustomBlockModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={onSubmitCustomBlock}
        environment={environment}
      />
    </div>
  );
}
