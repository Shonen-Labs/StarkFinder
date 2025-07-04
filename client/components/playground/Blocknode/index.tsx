import type React from "react"
import { Handle, Position } from "reactflow"
import AllocateNode from "./AllocateNode"
import EventNode from "./EventNode"
import LiquidityNode from "./LiquidityNode"
import StakeNode from "./StakeNode"
import SwapNode from "./SwapNode"
import BurnNode from "./BurnNode"
import MintNode from "./MintNode"
import TransferNode from "./TransferNode"

// Define BlockNode component outside of Web3BlocksComponent
interface BlockNodeInterface {
  data: {
    id: string
    color: string
    borderColor: string
    hoverBorderColor: string
    content: string
    icon: React.ComponentType
    label: string
    selected: boolean
  }
  isDragging: boolean
  id: string
}

export default function BlockNode({ data, isDragging, id }: BlockNodeInterface) {
  const isSelected = data.selected || false

  if (data.id === "swap") {
    return (
      <SwapNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        id={""}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  if (data.id === "stake") {
    return (
      <StakeNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        type={""}
        id={""}
        selected={isSelected}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  if (data.id === "liquidity") {
    return (
      <LiquidityNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        id={""}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  if (data.id === "allocate") {
    return (
      <AllocateNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
        id={""}
      />
    )
  }

  if (data.id === "event") {
    return (
      <EventNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        id={""}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  if (data.id === "mintTokens") {
    return (
      <MintNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        id={""}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  if (data.id === "burnTokens") {
    return (
      <BurnNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        id={""}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  if (data.id === "transferTokens") {
    return (
      <TransferNode
        data={{ ...data, isSelected }}
        isConnectable={true}
        id={""}
        selected={isSelected}
        type={""}
        zIndex={isSelected ? 50 : 0}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    )
  }

  return (
    <div
      className={`${data.color} text-white p-6 rounded-lg shadow-md cursor-pointer select-none
                  flex items-center justify-between border-[1px] transition-all duration-300 w-[200px] 
                  ${isDragging ? "opacity-70" : ""} ${isSelected ? "node-selected" : ""}
                  ${isSelected ? "border-white shadow-glow ring-4 ring-white" : data.borderColor} 
                  ${isSelected ? "" : data.hoverBorderColor} relative`}
      style={{
        zIndex: isSelected ? 50 : "auto",
      }}
    >
      {id !== "start" && <Handle type="target" position={Position.Top} style={{ background: "#555" }} />}
      <span>{data.content}</span>
      <data.icon />
      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  )
}
