"use client"

import type React from "react"
import { useState } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

const tokens = ["ETH", "USDT", "BTC", "DAI", "LINK"]

const TransferNode: React.FC<NodeProps> = ({ isConnectable, selected, data }) => {
  const [selectedToken, setSelectedToken] = useState(tokens[0])
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const isSelected = selected || data?.selected
  const borderColor = isSelected
    ? "border-[3px] border-white ring-4 ring-white"
    : "border-[1px] border-[#2F5B87] hover:border-[#4C86C1]"

  return (
    <div
      className={`bg-[#17273E] text-white p-4 rounded-lg shadow-md ${borderColor}
                  transition-all duration-300 w-[300px] ${isSelected ? "shadow-glow node-selected" : ""}`}
      style={{
        zIndex: isSelected ? 50 : "auto",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span>Transfer Tokens</span>
        <Send className="w-4 h-4" />
      </div>

      <div className="flex flex-col space-y-2" onClick={(e) => e.stopPropagation()}>
        <Select onValueChange={setSelectedToken} value={selectedToken}>
          <SelectTrigger className="w-full bg-[#1F3350] border-[1px] border-[#2F5B87]">
            <SelectValue placeholder="Select Token" />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token} value={token}>
                {token}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={handleAmountChange}
          className="w-full bg-[#1F3350] border-[1px] border-[#2F5B87]"
        />

        <Input
          type="text"
          placeholder="Recipient address (0x...)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full bg-[#1F3350] border-[1px] border-[#2F5B87]"
        />
      </div>

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  )
}

export default TransferNode
