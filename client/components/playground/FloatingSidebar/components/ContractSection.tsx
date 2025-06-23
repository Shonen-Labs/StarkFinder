import React from "react";
import clsx from "clsx";
import { Block, MenuItem, ToggleAction } from "../types";
import DropdownArrowIcon from "@/components/svgs/DropdownArrowIcon";
import ToggleBtn from "@/components/svgs/ToggleBtn";

interface ContractSectionProps {
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
  blockArray: Block[];
  isToggled: boolean;
  toggleAction: ToggleAction;
  dispatch: React.Dispatch<ToggleAction>;
  addBlock: (block: Block) => void;
  onToggleButton: boolean;
  switchToggleBtn: () => void;
  showToggle?: boolean;
}

export const ContractSection: React.FC<ContractSectionProps> = ({
  title,
  icon,
  items,
  blockArray,
  isToggled,
  toggleAction,
  dispatch,
  addBlock,
  onToggleButton,
  switchToggleBtn,
  showToggle = true,
}) => (
  <div className={clsx("hover:bg-gray-200 rounded-lg", isToggled && "bg-gray-200")}>
    <div
      onClick={(e) => {
        e.stopPropagation();
        dispatch(toggleAction);
      }}
      className="px-3 py-2 flex justify-between items-center"
    >
      <div className="flex gap-3">
        <span>{icon}</span>
        <div className="text-black cursor-default">{title}</div>
      </div>
      <div>
        {isToggled ? (
          <DropdownArrowIcon status="open" />
        ) : (
          <DropdownArrowIcon status="closed" />
        )}
      </div>
    </div>

    {isToggled && (
      <div className="ml-10 my-2 mr-2 flex flex-col gap-2">
        {items.map((item, index) => {
          const block = blockArray[index];
          return (
            <div
              key={item.text}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md mr-2"
            >
              <div
                className="flex justify-between items-center"
                onClick={() => block && addBlock(block)}
              >
                <div className="flex gap-3">
\                  <div className="text-black hover:font-medium">{item.text}</div>
                </div>
                <span>
                  {item.toggle &&
                    showToggle &&
                    (onToggleButton ? (
                      <ToggleBtn mode="on" onClick={switchToggleBtn} />
                    ) : (
                      <ToggleBtn mode="off" onClick={switchToggleBtn} />
                    ))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);