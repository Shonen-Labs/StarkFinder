import React, { useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Landmark, Plus, SquareMinus } from 'lucide-react'

const tokens = ['ETH', 'USDT', 'BTC', 'DAI', 'LINK']

const StakeNode: React.FC<NodeProps> = ({ isConnectable, selected, data }) => {
    const [tokenInputs, setTokenInputs] = useState([
        { token: tokens[0], amount: '' }
    ])

    const addTokenInput = useCallback(() => {
        setTokenInputs(prev => [...prev, { token: tokens[0], amount: '' }])
    }, [])

    const removeTokenInput = useCallback((index: number) => {
        setTokenInputs(prev => prev.filter((_, i) => i !== index))
    }, [])

    const onTokenChange = useCallback((value: string, index: number) => {
        setTokenInputs(prev => prev.map((item, i) => 
            i === index ? { ...item, token: value } : item
        ))
    }, [])

    const onAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        setTokenInputs(prev => prev.map((item, i) => 
            i === index ? { ...item, amount: event.target.value } : item
        ))
    }, [])

    const isSelected = selected || data?.selected;
    const borderColor = isSelected 
        ? "border-[3px] border-white ring-4 ring-white" 
        : "border-[1px] border-[#663B6A] hover:border-[#FB6A9E]";

    return (
        <div 
            className={`bg-[#322131] text-white p-4 rounded-lg shadow-md ${borderColor} 
                       transition-all duration-300 w-[250px] ${isSelected ? 'shadow-glow node-selected' : ''}`}
            style={{
                zIndex: isSelected ? 50 : 'auto',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <span>Stake Tokens</span>
                <Landmark className="w-4 h-4" />
            </div>

            <div className="flex flex-col space-y-2" onClick={(e) => e.stopPropagation()}>
                {tokenInputs.map((input, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                            <Select onValueChange={(value) => onTokenChange(value, index)} value={input.token}>
                                <SelectTrigger className="w-full bg-[#3f2c48] border-[1px] border-[#663B6A]">
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
                                type="number"
                                placeholder="Amount"
                                value={input.amount}
                                onChange={(e) => onAmountChange(e, index)}
                                className="bg-[#3f2c48] border-[1px] border-[#663B6A]"
                            />
                            {index > 0 && (
                                <SquareMinus 
                                    onClick={() => removeTokenInput(index)} 
                                    className="w-8 h-8 cursor-pointer hover:text-[#FB6A9E]" 
                                />
                            )}
                        </div>
                    </div>
                ))}
                <Plus 
                    onClick={addTokenInput} 
                    className="w-4 h-4 cursor-pointer hover:text-[#FB6A9E] self-center" 
                />
            </div>

            <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
        </div>
    )
}

export default StakeNode