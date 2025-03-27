// import { ArgentTMA } from "@argent/tma-wallet";
import { ArgentWebWallet } from "@argent/invisible-sdk";

let argentTMA: ArgentWebWallet | null = null;

export const getArgentTMA = () => {
  if (typeof window === "undefined") return null;

  if (!argentTMA) {
    argentTMA = ArgentWebWallet.init({
      environment: "sepolia",
      appName: "StarkFinder",
      sessionParams: {
        allowedMethods: [
          {
            // Use an actual contract address here
            contract: "0x0",
            selector: "*",
          },
        ],
        validityDays: 30,
      },
    });
  }
  return argentTMA;
};
