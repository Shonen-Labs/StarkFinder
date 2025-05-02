"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EnvironmentSwitchProps {
  onChange: (environment: "starknet" | "dojo") => void;
  defaultEnvironment?: "starknet" | "dojo";
}

export default function EnvironmentSwitch({ 
  onChange, 
  defaultEnvironment = "starknet" 
}: EnvironmentSwitchProps) {
  const [environment, setEnvironment] = useState<"starknet" | "dojo">(defaultEnvironment);

  const handleToggle = () => {
    const newEnvironment = environment === "starknet" ? "dojo" : "starknet";
    setEnvironment(newEnvironment);
    onChange(newEnvironment);
  };

  return (
    <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-100 rounded-md">
      <Label 
        htmlFor="environment-switch" 
        className={`text-sm font-medium ${environment === "starknet" ? "text-blue-600" : "text-gray-500"}`}
      >
        Starknet
      </Label>
      <Switch
        id="environment-switch"
        checked={environment === "dojo"}
        onCheckedChange={handleToggle}
      />
      <Label 
        htmlFor="environment-switch" 
        className={`text-sm font-medium ${environment === "dojo" ? "text-green-600" : "text-gray-500"}`}
      >
        Dojo
      </Label>
    </div>
  );
}