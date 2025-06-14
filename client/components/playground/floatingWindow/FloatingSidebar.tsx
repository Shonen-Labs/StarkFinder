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
          <Icon className="h-4 w-4 text-gray-700"/>
          <span className="text-black">{title}</span>
        </div>
        <DropdownArrowIcon status={isOpen ? "open" : "closed"}/>
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
  const [env, setEnv] = useState<"starknet" | "dojo">("starknet");
  const [toggles, dispatch] = useReducer(toggleReducer, initialToggles);
  const [customBlocks, setCustomBlocks] = useState<Block[]>([]);
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null);
  const starkRef = useRef<HTMLDivElement>(null);

  const formSchema = z.object({
    blockName: z.string().min(1),
    cairoCode: z.string().min(1),
  });
  const form = useForm({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (starkRef.current && env === "starknet") {
      setSidebarHeight(starkRef.current.scrollHeight);
    }
  }, [env]);

  function handleCustom(values: z.infer<typeof formSchema>) {
    const newBlock: Block = {
      id: `custom-${Date.now()}`,
      content: values.blockName,
      color: "bg-[#3C3C3C]",
      borderColor: "border-[#6C6C6C]",
      hoverBorderColor: "hover:border-[#9C9C9C]",
      icon: Code,
      code: values.cairoCode,
    };
    addBlock(newBlock);
    setCustomBlocks((b) => [...b, newBlock]);
    toast.success("Custom block added");
    form.reset();
  }

  const sidebarStyle = env === "dojo" && sidebarHeight ? { minHeight: sidebarHeight } : {};

  return (
    <div className="w-[300px] bg-white p-6 rounded-lg shadow-lg text-sm" style={sidebarStyle}>
      <EnvironmentSwitch onChange={setEnv} defaultEnvironment="starknet" />

      {env === "starknet" ? (
        <div ref={starkRef} className="text-[18px]">
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

      {/* Custom Blocks */}
      <div className="mt-6">
        <div
          className="px-3 py-2 flex justify-between items-center rounded-lg hover:bg-gray-200 cursor-pointer"
          onClick={() => form.setValue("blockName", "")}
        >
          <div className="flex gap-3 items-center">
            <Code className="h-4 w-4 text-gray-700" />
            <span className="text-black">Custom</span>
          </div>
        </div>
        {customBlocks.length > 0 && (
          <div className="ml-8 mt-2 flex flex-col gap-2">
            {customBlocks.map((b) => (
              <div
                key={b.id}
                className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                onClick={() => addBlock(b)}
              >
                <Code className="h-4 w-4 text-gray-600" />
                <span className="text-black">{b.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo & Links */}
      <div className="mt-8 p-4 bg-[#104926] rounded-md text-white text-center">
        <p>Take full control of your rewards! 🚀</p>
        <button className="mt-4 py-2 w-full bg-[#F6FFFE] text-[#297E71] rounded-md shadow">
          Claim Token
        </button>
      </div>

      <Link
        href="/devx/contracts"
        className="mt-4 block py-2 text-center bg-neutral-50 rounded-md hover:bg-gray-200"
      >
        Contracts
      </Link>
      <Link
        href="/devx/resources"
        className="mt-2 block py-2 text-center bg-neutral-50 rounded-md hover:bg-gray-200"
      >
        Resources
      </Link>

      <CustomBlockModal
        isOpen={form.formState.isSubmitting}
        onClose={() => {}}
        onSubmit={handleCustom}
        environment={env}
      />
    </div>
  );
}
