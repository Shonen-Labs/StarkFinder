import React, { useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Fan } from 'lucide-react'
import { Input } from "@/components/ui/input"

const currencies = ['ETH', 'USDT', 'BTC', 'DAI', 'LINK']

const EventNode: React.FC<NodeProps> = ({ isConnectable, selected, data }) => {
    const [fromCurrency, setFromCurrency] = useState(currencies[0])
    const [toCurrency, setToCurrency] = useState(currencies[1])
    const [comparisonType, setComparisonType] = useState('')

    const onFromCurrencyChange = useCallback((value: string) => {
        setFromCurrency(value)
    }, [])

    const onToCurrencyChange = useCallback((value: string) => {
        setToCurrency(value)
    }, [])

    const onComparisonTypeChange = useCallback((value: string) => {
        setComparisonType(value)
    }, [])

    const isSelected = selected || data?.selected;
    
    const borderColor = isSelected 
        ? "border-[3px] border-white ring-4 ring-white" 
        : "border-[1px] border-[#791919] hover:border-[#BC2F2F]";

    return (
        <div 
            className={`bg-[#4A0505] text-white p-4 rounded-lg shadow-md ${borderColor} 
                      transition-all duration-300 w-[250px] ${isSelected ? 'shadow-glow node-selected' : ''}`}
            style={{
                zIndex: isSelected ? 50 : 'auto',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <span>On Event</span>
                <Fan className="w-4 h-4" />
            </div>
            <div className="flex flex-col space-y-2" onClick={(e) => e.stopPropagation()}>
                <Select onValueChange={onFromCurrencyChange} value={fromCurrency}>
                    <SelectTrigger className="w-full bg-[#5A0606] border-[1px] border-[#811b1b]">
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
                
                <Select onValueChange={onComparisonTypeChange} value={comparisonType}>
                    <SelectTrigger className="w-full bg-[#4A0505] border-[1px] border-[#5A0606]">
                        <SelectValue placeholder="Select comparison" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lessThan" className='flex flex-row items-center'> Less Than</SelectItem>
                        <SelectItem value="greaterThan" className='flex flex-row items-center'> Greater Than</SelectItem>
                        <SelectItem value="equalTo" className='flex flex-row items-center'> Equal To</SelectItem>
                        <SelectItem value="custom" className='flex flex-row items-center'>Custom</SelectItem>
                    </SelectContent>
                </Select>
                
                <Input 
                    type="text" 
                    placeholder="x price" 
                    value={toCurrency} 
                    onChange={(e) => onToCurrencyChange(e.target.value)} 
                    className="w-full bg-[#5A0606] border-[1px] border-[#791919] text-white" 
                />
            </div>
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
        </div>
    )
}

export default EventNode