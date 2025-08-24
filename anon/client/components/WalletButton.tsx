import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useConnect, useDisconnect, Connector } from "wagmi";

export function WalletOptions() {
  const { address, isConnected, isDisconnected } = useAccount();
  const { connect, error, connectors, status } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const isLoading = status === "pending";

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to connect");
    }

    if (isConnected) {
      toast.success("connected successfully");
    }

    if (isDisconnected) {
      toast.warning("wallet is disconnected");
    }
  }, [error, isConnected, isDisconnected]);

  if (!isConnected) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="px-5 py-2 rounded-full bg-black text-white font-medium hover:bg-gray-900 transition dark:bg-black dark:text-white dark:hover:bg-gray-200">
            {isLoading ? "Connecting..." : "Login"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {connectors.map((connector: Connector) => (
            <DropdownMenuItem
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
              disabled={isLoading}
            >
              {connector.name}
              {isLoading && " (connecting...)"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={() => disconnect()}
      className="px-5 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition"
    >
      {address?.slice(0, 6)}...{address?.slice(-4)} (Logout)
    </Button>
  );
}
