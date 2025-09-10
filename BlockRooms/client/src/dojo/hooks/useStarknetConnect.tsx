// hooks/useStarknetConnect.ts
import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";
import { useState, useCallback } from "react";

export function useStarknetConnect() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { status, address } = useAccount();
  const [hasTriedConnect, setHasTriedConnect] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
 
    
    const connector = connectors[0]; // Cartridge connector
    if (!connector) {
      console.error("No connector found");
      return;
    }
    
    try {
      setIsConnecting(true);
      setHasTriedConnect(true);
      
      await connect({ connector });
  
    } catch (error) {
      console.error("❌ Connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(async () => {
    try {
       
      await disconnect();
      setHasTriedConnect(false); 
    } catch (error) {
      console.error("❌ Disconnection failed:", error);
    }
  }, [disconnect]);
 

  return { 
    status, 
    address,
    isConnecting,
    hasTriedConnect, 
    handleConnect,
    handleDisconnect,
    setHasTriedConnect 
  };
}