import xrp from "../public/crypto-icons/xrp.svg";
import algo from "../public/crypto-icons/algo.svg";
import usdc from "../public/crypto-icons/usdc.svg";
import usdt from "../public/crypto-icons/usdt.svg";
import tron from "../public/crypto-icons/trx.svg";
import bch from "../public/crypto-icons/bch.svg";

export interface CryptoCoin {
  name: string;
  logo: string;
  network: string;
  chainId: string;
  symbol: string;
  decimals: number;
}

export const CoinsLogo: CryptoCoin[] = [
  {
    name: "XRP",
    logo: xrp,
    network: "ripple_mainnet",
    chainId: "XRP",
    symbol: "XRP",
    decimals: 6
  },
  {
    name: "ALGO",
    logo: algo,
    network: "algorand_mainnet",
    chainId: "ALGO",
    symbol: "ALGO",
    decimals: 6
  },
  {
    name: "USDC",
    logo: usdc,
    network: "ethereum_mainnet",
    chainId: "1",
    symbol: "USDC",
    decimals: 6
  },
  {
    name: "USDT",
    logo: usdt,
    network: "ethereum_mainnet",
    chainId: "1",
    symbol: "USDT",
    decimals: 6
  },
  {
    name: "TRON",
    logo: tron,
    network: "tron_mainnet",
    chainId: "TRX",
    symbol: "TRX",
    decimals: 6
  },
  {
    name: "BCH",
    logo: bch,
    network: "bitcoin_cash_mainnet",
    chainId: "BCH",
    symbol: "BCH",
    decimals: 8
  },
];
