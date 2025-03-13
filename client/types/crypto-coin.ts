import usdc from "../public/crypto-icons/usdc.svg";
import usdt from "../public/crypto-icons/usdt.svg";
import strk from "../public/crypto-icons/strk.svg";
import eth from "../public/crypto-icons/ether.svg";
import btc from "../public/crypto-icons/btc.svg";
import brother from "../public/crypto-icons/brother.webp";

export type CryptoCoin = {
  id: string;
  name: string;
  logo: string;
  chain: string; // Add chain property
};

export const CoinsLogo: CryptoCoin[] = [
  { id: "1", name: "STRK", logo: strk, chain: "Starknet" },
  { id: "2", name: "ETH", logo: eth, chain: "Ethereum" },
  { id: "3", name: "USDC", logo: usdc, chain: "Ethereum" },
  { id: "4", name: "USDT", logo: usdt, chain: "Ethereum" },
  { id: "5", name: "BTC", logo: btc, chain: "Bitcoin" },
  { id: "6", name: "BROTHER", logo: brother, chain: "Starknet" }, // Example chain, adjust as needed
];
