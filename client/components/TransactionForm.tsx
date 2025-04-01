/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "@starknet-react/core";

interface TransactionFormProps {
  onSubmit: (result: any) => void;
}

type FormData = {
  token: string;
  amount: string;
  recipient: string;
  protocol: string;
  toToken: string;
};

type ActionType = 'swap' | 'transfer' | 'deposit' | 'withdraw' | 'bridge';

const actionFields: Record<ActionType, (keyof FormData)[]> = {
  swap: ['token', 'amount', 'toToken'], // Reintroducing swap
  transfer: ['token', 'amount', 'recipient'],
  deposit: ['token', 'amount', 'protocol'],
  withdraw: ['protocol', 'token', 'amount'],
  bridge: ['token', 'amount'] // Reintroducing bridge
};

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit }) => {
  const [action, setAction] = useState<ActionType | ''>('');
  const [formData, setFormData] = useState<FormData>({
    token: "",
    amount: "",
    recipient: "",
    protocol: "",
    toToken: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Construct prompt based on action type and form data
    let prompt = "";
    switch (action) {
      case "swap":
        prompt = `Swap ${formData.amount} ${formData.token} to ${formData.toToken}`;
        break;
      case "transfer":
        prompt = `Transfer ${formData.amount} ${formData.token} to ${formData.recipient}`;
        break;
      case "deposit":
        prompt = `Deposit ${formData.amount} ${formData.token} into ${formData.protocol}`;
        break;
      case "withdraw":
        prompt = `Withdraw ${formData.amount} ${formData.token} from ${formData.protocol}`;
        break;
      case "bridge":
        prompt = `Bridge ${formData.amount} ${formData.token} to Ethereum`;
        break;
      default:
        throw new Error('Invalid action type');
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          address: address || '0x0',
          chainId: '4012',
          messages: [{
            sender: 'user',
            content: prompt,
          }],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onSubmit(data.result[0]);
      } else {
        throw new Error(data.error || 'Failed to process transaction');
      }
    } catch (error) {
      console.error('Error:', error);
      // You might want to add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const renderFields = () => {
    if (!action) return null;

    const fields = actionFields[action];
    return fields.map((field) => (
      <div key={field} className="space-y-2">
        <label className="text-sm text-white/80 capitalize">{field}</label>
        <Input
          type={field === 'amount' ? 'number' : 'text'}
          placeholder={`Enter ${field}`}
          value={formData[field]}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          className="bg-white/5 border border-white/20 text-white"
        />
      </div>
    ));
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900/50 border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Create Transaction</CardTitle>
        <CardDescription className="text-white/60">
          Select an action and fill in the required details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/80">Action</label>
            <Select 
              onValueChange={(value: ActionType) => {
                setAction(value);
                setFormData({
                  token: "",
                  amount: "",
                  recipient: "",
                  protocol: "",
                  toToken: ""
                });
              }}
            >
              <SelectTrigger className="bg-white/5 border border-white/20 text-white">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border border-white/20">
                <SelectItem value="swap">Swap</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderFields()}

          {action && (
            <Button 
              type="submit" 
              className="w-full bg-white/10 hover:bg-white/20 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Submit Transaction"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};