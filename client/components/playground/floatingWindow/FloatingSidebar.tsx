"use client";

import { useState, useReducer, useEffect, useRef, ComponentType, SVGProps } from "react";
// import dojoBlocks from "../Dojo/DojoBlocks";
import { DojoBlock as ImportedDojoBlock } from "../Dojo/types";
import groupedBlocks from "./contractGroupedBlocks";

// Components
import EnvironmentSwitch from "../Dojo/EnvironmentSwitch";
import DojoBlocksSidebar from "../Dojo/DojoBlocksSidebar";
import CustomBlockModal from "../Modal/CustomBlock";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import Link from "next/link";
import { Code } from "lucide-react";
import DropdownArrowIcon from "@/components/svgs/DropdownArrowIcon";

import RewardIcon from "@/components/svgs/RewardIcon";
import MenuIcon from "@/components/svgs/MenuIcon";

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

const dojoBlockAdapter = (dojoBlock: ImportedDojoBlock): Block => ({
  id: dojoBlock.id,
  content: dojoBlock.title || dojoBlock.content || "",
  color: dojoBlock.color || "bg-[#3C3C3C]",
  borderColor: dojoBlock.borderColor || "border-[#6C6C6C]",
  hoverBorderColor: dojoBlock.hoverBorderColor || "hover:border-[#9C9C9C]",
  icon: dojoBlock.icon || Code,
  code: dojoBlock.code || dojoBlock.description || "",
});

// toggle reducer for multiple sections
type ToggleAction = { type: string };
interface ToggleState { [key: string]: boolean }
const initialToggles: ToggleState = Object.fromEntries(
  Object.keys(groupedBlocks).map((key) => [key, false])
);

function toggleReducer(state: ToggleState, action: ToggleAction): ToggleState {
  const key = action.type.replace("toggle_", "");
  return { ...initialToggles, [key]: !state[key] };
}

interface SectionProps {
  title: string;
  icon: IconType;
  blocks: Block[];
  isOpen: boolean;
  onToggle: () => void;
  addBlock: (b: Block) => void;
}
function Section({ title, icon: Icon, blocks, isOpen, onToggle, addBlock }: SectionProps) {
  return (
    <div className="mt-6">
      <div
        className={clsx(
          "flex justify-between items-center cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-200",
          isOpen && "bg-gray-200"
        )}
        onClick={onToggle}
      >
        <div className="flex gap-3 items-center">
          <Icon className="h-4 w-4 text-gray-700" />
          <span className="text-black">{title}</span>
        </div>
        <DropdownArrowIcon status={isOpen ? "open" : "closed"} />
      </div>
      {isOpen && (
        <div className="ml-8 mt-2 flex flex-col gap-2">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer flex items-center gap-3"
              onClick={() => addBlock(block)}
            >
              <block.icon className="h-4 w-4 text-gray-600" />
              <span className="text-black">{block.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FloatingSidebarProps {
  addBlock: (block: Block) => void;
}

export default function FloatingSidebar({ addBlock }: FloatingSidebarProps) {
  const [toggles, dispatch] = useReducer(toggleReducer, initialToggles);
  const [customBlocks, setCustomBlocks] = useState<Block[]>([]);
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null);
  const starknetRef = useRef<HTMLDivElement>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [environment, setEnvironment] = useState<"starknet" | "dojo">(
    "starknet"
  );

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

  const sidebarStyle = environment === "dojo" && sidebarHeight ? { minHeight: sidebarHeight } : {};

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
        <div ref={starknetRef} className="text-[12px]">
          {Object.entries(groupedBlocks).map(([section, { icon, blocks }]) => {
            const adaptedBlocks: Block[] = blocks.map((b) => ({
              id: b.id,
              content: b.content,
              icon: b.icon,
              color: "bg-[#1E3A3A]",
              borderColor: "border-[#2A5656]",
              hoverBorderColor: "hover:border-[#3E7D7D]",
            }));

            return (
              <Section
                key={section}
                title={section}
                icon={icon}
                blocks={adaptedBlocks}
                isOpen={toggles[section]}
                onToggle={() => dispatch({ type: `toggle_${section}` })}
                addBlock={addBlock}
              />
            );
          })}
        </div>
      ) : (
        <DojoBlocksSidebar addBlock={(d) => addBlock(dojoBlockAdapter(d))} />
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