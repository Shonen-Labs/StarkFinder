import { http, createConfig } from "wagmi";
import {
  mainnet,
  sepolia,
  base,
  arbitrum,
  polygon,
  optimism,
} from "wagmi/chains";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;

export const config = createConfig({
  chains: [mainnet, base, arbitrum, polygon, optimism, sepolia],
  connectors: [metaMask(), walletConnect({ projectId }), injected(), safe()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
