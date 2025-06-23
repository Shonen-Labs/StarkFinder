import React, { ComponentType, SVGProps } from "react";

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface Block {
  id: string;
  content: string;
  color: string;
  borderColor: string;
  hoverBorderColor: string;
  icon: IconType;
  code?: string;
}

export interface MenuItem {
  icon: React.ComponentType<object>;
  text?: string;
  toggle?: boolean;
  groupedBlock?: Block[];
  block?: Block; // For combined items like triggerActions
}

export interface FloatingSidebarProps {
  addBlock: (block: Block) => void;
}

export interface ToggleState {
  triggerActionToggle: boolean;
  tokenERC20Toggle: boolean;
  tokenERC20DeflationaryToggle: boolean;
  nftERC721Toggle: boolean;
  nftERC1155Toggle: boolean;
  crowsaleICOToggle: boolean;
  daoToggle: boolean;
  blockchainLotteryToggle: boolean;
  airdropMultisenderToggle: boolean;
  multisigToggle: boolean;
  multisigWalletToggle: boolean;
  vestingToggle: boolean;
  stakingToggle: boolean;
  farmingToggle: boolean;
  tokenLockerToggle: boolean;
  liquidityLockerToggle: boolean;
  erc4626VaultsToggle: boolean;
}

export type ToggleAction =
  | { type: "toggle_triggerAction" }
  | { type: "toggle_tokenERC20" }
  | { type: "toggle_tokenERC20Deflationary" }
  | { type: "toggle_nftERC721" }
  | { type: "toggle_nftERC1155" }
  | { type: "toggle_crowsaleICO" }
  | { type: "toggle_dao" }
  | { type: "toggle_blockchainLottery" }
  | { type: "toggle_airdropMultisender" }
  | { type: "toggle_multisig" }
  | { type: "toggle_multisigWallet" }
  | { type: "toggle_vesting" }
  | { type: "toggle_staking" }
  | { type: "toggle_farming" }
  | { type: "toggle_tokenLocker" }
  | { type: "toggle_liquidityLocker" }
  | { type: "toggle_erc4626Vaults" };