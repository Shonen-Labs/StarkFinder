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
};
export const CoinsLogo: CryptoCoin[] = [
  { id: "1", name: "STRK", logo: strk },
  { id: "2", name: "ETH", logo: eth },
  { id: "3", name: "USDC", logo: usdc },
  { id: "4", name: "USDT", logo: usdt },
  { id: "5", name: "WBTC", logo: btc },
  { id: "6", name: "BROTHER", logo: brother },
];
