import xrp from "../public/crypto-icons/xrp.svg";
import algo from "../public/crypto-icons/algo.svg";
import usdc from "../public/crypto-icons/usdc.svg";
import usdt from "../public/crypto-icons/usdt.svg";
import tron from "../public/crypto-icons/trx.svg";
import bch from "../public/crypto-icons/bch.svg";

export type CryptoCoin = {
  id: string;
  name: string;
  logo: string;
};
export const CoinsLogo: CryptoCoin[] = [
  { id: "1", name: "XRP", logo: xrp },
  { id: "2", name: "ALGO", logo: algo },
  { id: "3", name: "USDC", logo: usdc },
  { id: "4", name: "USDT", logo: usdt },
  { id: "5", name: "TRON", logo: tron },
  { id: "6", name: "BCH", logo: bch },
];
