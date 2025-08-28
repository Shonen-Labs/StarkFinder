"use client";

import CodeEditor from "@/components/editor/CodeEditor";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { Button } from "@/components/ui/button";

export default function Code() {
  const { address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full overflow-x-hidden overflow-y-hidden">
      <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700">
        {status === "connected" ? (
          <div className="space-y-2">
            <p className="text-white text-sm break-all">Connected: {address}</p>
            <Button onClick={() => disconnect()}>Disconnect</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="w-full"
              >
                Connect {connector.name}
              </Button>
            ))}
          </div>
        )}
      </aside>

      <main className="flex-1 w-full h-screen overflow-x-hidden">
        <CodeEditor />
      </main>
    </div>
  );
}
