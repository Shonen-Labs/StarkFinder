import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

const currencies = ["ETH", "USDT", "BTC", "DAI", "LINK"];

const SwapNode: React.FC<NodeProps> = ({ isConnectable, selected, data }) => {
  const [fromCurrency, setFromCurrency] = useState(currencies[0]);
  const [toCurrency, setToCurrency] = useState(currencies[1]);

  const onFromCurrencyChange = useCallback((value: string) => {
    setFromCurrency(value);
  }, []);

  const onToCurrencyChange = useCallback((value: string) => {
    setToCurrency(value);
  }, []);

  const isSelected = selected || data?.selected;
  const borderColor = isSelected 
      ? "border-[3px] border-white ring-4 ring-white" 
      : "border-[1px] border-[#245C3D] hover:border-[#6AFB8E]";

  return (
    <div 
      className={`bg-[#142321] text-white p-4 rounded-lg shadow-md ${borderColor} 
                 transition-all duration-300 w-[250px] ${isSelected ? 'shadow-glow node-selected' : ''}`}
      style={{
        zIndex: isSelected ? 50 : 'auto',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span>Swap Tokens</span>
        <ArrowRightLeft className="w-4 h-4" />
      </div>
      <div
        className="flex flex-col space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Select onValueChange={onFromCurrencyChange} value={fromCurrency}>
          <SelectTrigger className="w-full bg-[#113731] border-[1px] border-[#245C3D]">
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm">for</div>
        <Select onValueChange={onToCurrencyChange} value={toCurrency}>
          <SelectTrigger className="w-full bg-[#113731] border-[1px] border-[#245C3D]">
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default SwapNode;