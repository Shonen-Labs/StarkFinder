import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Droplets, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const currencies = ["ETH", "USDT", "BTC", "DAI", "LINK"];

const LiquidityNode: React.FC<NodeProps> = ({ isConnectable, selected, data }) => {
  const [fromCurrency, setFromCurrency] = useState(currencies[0]);
  const [toCurrency, setToCurrency] = useState("");
  const [error, setError] = useState("");

  const onFromCurrencyChange = useCallback((value: string) => {
    setFromCurrency(value);
  }, []);

  const onToCurrencyChange = useCallback(() => {
    if (isNaN(Number(toCurrency))) {
      setError("Please enter a valid number");
    } else {
      setError("");
      // Here you can add logic to handle the valid input
      console.log("Valid amount:", Number(toCurrency));
    }
  }, [toCurrency]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setToCurrency(value);
      setError("");
    }
  };

  const isSelected = selected || data?.selected;
  const borderClass = isSelected 
    ? "border-[3px] border-white ring-4 ring-white" 
    : "border-[1px] border-[#2F5B87] hover:border-[#4C86C1]";

  return (
    <div 
      className={`bg-[#17273E] text-white p-4 rounded-lg shadow-md ${borderClass} transition-colors w-[250px] ${isSelected ? 'shadow-glow' : ''}`}
      style={{ zIndex: isSelected ? 50 : 'auto' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span>Add Liquidity</span>
        <Droplets className="w-4 h-4" />
      </div>
      <div
        className="flex flex-col space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <input
            type="text"
            value={toCurrency}
            onChange={handleInputChange}
            placeholder="Enter amount"
            className="w-full text-sm bg-[#1F3350] border-[1px] border-[#2F5B87] p-2 rounded-md"
          />
          <Button
            onClick={onToCurrencyChange}
            className="bg-[#2F5B87] text-white size-9 ml-2 rounded-md hover:bg-[#4C86C1] transition-colors"
          >
            <Check />
          </Button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <Select onValueChange={onFromCurrencyChange} value={fromCurrency}>
          <SelectTrigger className="w-full bg-[#1F3350] border-[1px] border-[#2F5B87]">
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

export default LiquidityNode;