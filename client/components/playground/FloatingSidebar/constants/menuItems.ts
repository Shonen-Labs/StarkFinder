/* eslint-disable @typescript-eslint/no-explicit-any */
import groupedBlocks from "../data";
import { MenuItem } from "../types";

// Import all your icons
import FlagIcon from "@/components/svgs/FlagIcon";
import ConnectionIcon from "@/components/svgs/ConnectionIcon";
import CoinIcon from "@/components/svgs/CoinIcon";
import SwapTokenIcon from "@/components/svgs/SwapTokenIcon";
import AllocateTokenIcon from "@/components/svgs/AllocateTokenIcon";
import AnalyticsIcon from "@/components/svgs/AnalyticsIcon";
import SetStrategyIcon from "@/components/svgs/SetStrategyIcon";
import RewardIcon from "@/components/svgs/RewardIcon";
import CubeIcon from "@/components/svgs/CubeIcon";
import CalenderIcon from "@/components/svgs/CalenderIcon";
import RepayLoanIcon from "@/components/svgs/RepayLoanIcon";
import VoteIcon from "@/components/svgs/VoteIcon";
import GovernanceIcon from "@/components/svgs/GovernanceIcon";
import PeopleIcon from "@/components/svgs/PeopleIcon";
import BagIcon from "@/components/svgs/BagIcon";
import AirdropIcon from "@/components/svgs/AirdropIcon";
import PadlockIcon from "@/components/svgs/PadlockIcon";
import PortfolioIcon from "@/components/svgs/PortfolioIcon";
import ClockIcon from "@/components/svgs/ClockIcon";
import LossIcon from "@/components/svgs/LossIcon";
import StakeTokenIcon from "@/components/svgs/StakeTokenIcon";
import AddIcon from "@/components/svgs/AddIcon";
import YieldFarmingIcon from "@/components/svgs/YieldFarmingIcon";
import LiquidDropIcon from "@/components/svgs/LiquidDropIcon";
import EnergyIcon from "@/components/svgs/EnergyIcon";

export const triggerActions: (MenuItem & { groupedBlock: any})[] = [
  {
    icon: FlagIcon,
    text: "Initialise",
    toggle: false,
    groupedBlock: groupedBlocks["Trigger Actions"],
  },
  {
    icon: ConnectionIcon,
    text: "Connection",
    toggle: true,
    groupedBlock: groupedBlocks["Trigger Actions"],
  },
];

export const tokenERC20: MenuItem[] = [
  { icon: CoinIcon, text: "Mint Tokens", toggle: false },
  { icon: CoinIcon, text: "Burn Tokens", toggle: false },
  { icon: SwapTokenIcon, text: "Transfer Tokens", toggle: false },
  { icon: AllocateTokenIcon, text: "Approve Token Spending", toggle: false },
  { icon: CoinIcon, text: "Set Token Price", toggle: false },
  { icon: AnalyticsIcon, text: "Token Balance Check", toggle: false },
  { icon: SetStrategyIcon, text: "Set Transfer Limits", toggle: false },
];

export const tokenERC20Deflationary: MenuItem[] = [
  { icon: CoinIcon, text: "Auto Burn on Transfer", toggle: true },
  { icon: CoinIcon, text: "Manual Burn Tokens", toggle: false },
  { icon: SetStrategyIcon, text: "Set Burn Rate", toggle: false },
  { icon: AnalyticsIcon, text: "Burn Event Tracking", toggle: false },
  { icon: CoinIcon, text: "Set Transaction Fees", toggle: false },
  { icon: RewardIcon, text: "Fee Distribution", toggle: false },
];

export const nftERC721: MenuItem[] = [
  { icon: CubeIcon, text: "Mint NFT", toggle: false },
  { icon: SetStrategyIcon, text: "Set NFT Metadata", toggle: false },
  { icon: SwapTokenIcon, text: "Transfer NFT", toggle: false },
  { icon: CoinIcon, text: "Burn NFT", toggle: false },
  { icon: RewardIcon, text: "Set Royalty Fee", toggle: false },
  { icon: CubeIcon, text: "Batch Mint NFTs", toggle: false },
];

export const nftERC1155: MenuItem[] = [
  { icon: CubeIcon, text: "Mint Token Batch", toggle: false },
  { icon: SetStrategyIcon, text: "Set Token Supply", toggle: false },
  { icon: CoinIcon, text: "Burn Token Batch", toggle: false },
  { icon: CoinIcon, text: "Set Individual Prices", toggle: false },
  { icon: SwapTokenIcon, text: "Batch Transfer", toggle: false },
  { icon: SetStrategyIcon, text: "Set Token Metadata", toggle: false },
];

export const crowsaleICO: MenuItem[] = [
  { icon: FlagIcon, text: "Create Campaign", toggle: false },
  { icon: CalenderIcon, text: "Set Sale Timeline", toggle: false },
  { icon: CoinIcon, text: "Set Token Price", toggle: false },
  { icon: CoinIcon, text: "Accept Payments", toggle: false },
  { icon: AllocateTokenIcon, text: "Distribute Tokens", toggle: false },
  { icon: RepayLoanIcon, text: "Refund Contributors", toggle: false },
];

export const dao: MenuItem[] = [
  { icon: VoteIcon, text: "Create Proposal", toggle: false },
  { icon: VoteIcon, text: "Vote on Proposal", toggle: false },
  { icon: GovernanceIcon, text: "Execute Proposal", toggle: false },
  { icon: PeopleIcon, text: "Delegate Voting Power", toggle: false },
  { icon: SetStrategyIcon, text: "Set Voting Parameters", toggle: false },
  { icon: BagIcon, text: "Treasury Management", toggle: false },
];

export const blockchainLottery: MenuItem[] = [
  { icon: FlagIcon, text: "Create Lottery", toggle: false },
  { icon: CoinIcon, text: "Buy Ticket", toggle: false },
  { icon: RewardIcon, text: "Generate Random Winner", toggle: false },
  { icon: AllocateTokenIcon, text: "Distribute Prizes", toggle: false },
  { icon: CoinIcon, text: "Set Ticket Price", toggle: false },
  { icon: SetStrategyIcon, text: "Set Prize Structure", toggle: false },
];

export const airdropMultisender: MenuItem[] = [
  { icon: AirdropIcon, text: "Bulk Send Tokens", toggle: false },
  { icon: AnalyticsIcon, text: "CSV Import Recipients", toggle: false },
  { icon: SetStrategyIcon, text: "Set Distribution Rules", toggle: false },
  { icon: AirdropIcon, text: "Merkle Tree Airdrop", toggle: false },
  { icon: RewardIcon, text: "Claim Tokens", toggle: false },
  { icon: PeopleIcon, text: "Whitelist Recipients", toggle: false },
];

export const multisig: MenuItem[] = [
  { icon: PadlockIcon, text: "Create Multisig Wallet", toggle: false },
  { icon: PeopleIcon, text: "Add Signers", toggle: false },
  { icon: PeopleIcon, text: "Remove Signers", toggle: false },
  { icon: SetStrategyIcon, text: "Set Signature Threshold", toggle: false },
  { icon: SwapTokenIcon, text: "Propose Transaction", toggle: false },
  { icon: VoteIcon, text: "Approve Transaction", toggle: false },
];

export const multisigWallet: MenuItem[] = [
  { icon: PortfolioIcon, text: "Wallet Balance Display", toggle: false },
  { icon: CubeIcon, text: "Multi-Asset Support", toggle: false },
  { icon: SetStrategyIcon, text: "Spending Limits", toggle: false },
  { icon: CalenderIcon, text: "Recurring Payments", toggle: false },
  { icon: AnalyticsIcon, text: "Budget Management", toggle: false },
  { icon: PeopleIcon, text: "Contact Management", toggle: false },
];

export const vesting: MenuItem[] = [
  { icon: CalenderIcon, text: "Create Vesting Schedule", toggle: false },
  { icon: ClockIcon, text: "Linear Vesting Release", toggle: false },
  { icon: PadlockIcon, text: "Cliff Vesting", toggle: false },
  { icon: RewardIcon, text: "Release Tokens", toggle: false },
  { icon: LossIcon, text: "Revoke Vesting", toggle: false },
  { icon: SetStrategyIcon, text: "Set Vesting Parameters", toggle: false },
];

export const staking: MenuItem[] = [
  { icon: StakeTokenIcon, text: "Start Staking", toggle: false },
  { icon: StakeTokenIcon, text: "Stop Staking", toggle: false },
  { icon: RewardIcon, text: "Claim Rewards", toggle: false },
  { icon: AddIcon, text: "Set Staking Pool", toggle: false },
  { icon: SetStrategyIcon, text: "Update Reward Rate", toggle: false },
  { icon: AnalyticsIcon, text: "Calculate Rewards", toggle: false },
];

export const farming: MenuItem[] = [
  { icon: YieldFarmingIcon, text: "Create Farm", toggle: false },
  { icon: AddIcon, text: "Add Liquidity to Farm", toggle: false },
  { icon: LiquidDropIcon, text: "Remove Liquidity from Farm", toggle: false },
  { icon: RewardIcon, text: "Harvest Rewards", toggle: false },
  { icon: SetStrategyIcon, text: "Set Farm Multipliers", toggle: false },
  { icon: StakeTokenIcon, text: "LP Token Staking", toggle: false },
];

export const tokenLocker: MenuItem[] = [
  { icon: PadlockIcon, text: "Lock Tokens", toggle: false },
  { icon: ClockIcon, text: "Set Lock Duration", toggle: false },
  { icon: PadlockIcon, text: "Unlock Tokens", toggle: false },
  { icon: ClockIcon, text: "Extend Lock Period", toggle: false },
  { icon: EnergyIcon, text: "Emergency Unlock", toggle: false },
  { icon: AnalyticsIcon, text: "Lock Analytics", toggle: false },
];

export const liquidityLocker: MenuItem[] = [
  { icon: PadlockIcon, text: "Lock LP Tokens", toggle: false },
  { icon: ClockIcon, text: "Set Liquidity Lock Duration", toggle: false },
  { icon: LiquidDropIcon, text: "Unlock LP Tokens", toggle: false },
  { icon: AnalyticsIcon, text: "Lock Verification", toggle: false },
  { icon: ClockIcon, text: "Extend Liquidity Lock", toggle: false },
  { icon: AnalyticsIcon, text: "LP Lock Analytics", toggle: false },
];

export const erc4626Vaults: MenuItem[] = [
  { icon: BagIcon, text: "Create Vault", toggle: false },
  { icon: AddIcon, text: "Deposit Assets", toggle: false },
  { icon: SwapTokenIcon, text: "Withdraw Assets", toggle: false },
  { icon: CoinIcon, text: "Mint Vault Shares", toggle: false },
  { icon: RepayLoanIcon, text: "Redeem Vault Shares", toggle: false },
  { icon: AnalyticsIcon, text: "Calculate Share Price", toggle: false },
];