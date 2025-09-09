import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Dojo & Starknet
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { dojoConfig } from "./dojo/dojoConfig";
import type { SchemaType } from "./dojo/models.gen";
import { setupWorld } from "./dojo/contracts.gen";
import StarknetProvider from "./dojo/starknet-provider";

// App Entry
import App from "./app/App";
import "./index.css";

// Init Dojo with error handling
async function main() {
  try {
    console.log("🚀 Initializing Dojo SDK...");

    const sdk = await init<SchemaType>({
      client: {
        toriiUrl: dojoConfig.toriiUrl,
        worldAddress: dojoConfig.manifest.world.address,
      },
      domain: {
        name: "DojoGameStarter",
        version: "1.0",
        chainId: "KATANA",
        revision: "1",
      },
    });

    console.log("✅ Dojo SDK initialized successfully");

    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    createRoot(rootElement).render(
      <StrictMode>
        <DojoSdkProvider
          sdk={sdk}
          dojoConfig={dojoConfig}
          clientFn={setupWorld}
        >
          <StarknetProvider>
            <App />
          </StarknetProvider>
        </DojoSdkProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error("❌ Failed to initialize Dojo:", error);

    // Fallback: render without Dojo if it fails
    const rootElement = document.getElementById("root");
    if (rootElement) {
      createRoot(rootElement).render(
        <StrictMode>
          <div className="min-h-screen bg-red-900 flex items-center justify-center">
            <div className="text-white text-center p-8">
              <h1 className="text-2xl font-bold mb-4">
                ⚠️ Dojo Initialization Error
              </h1>
              <p className="mb-4">Failed to connect to Dojo SDK</p>
              <details className="text-left">
                <summary className="cursor-pointer mb-2">
                  Error Details:
                </summary>
                <pre className="text-xs bg-black p-4 rounded overflow-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
              <p className="text-sm mt-4 opacity-70">
                Check your Dojo configuration and network connection
              </p>
            </div>
          </div>
        </StrictMode>
      );
    }
  }
}

main();
