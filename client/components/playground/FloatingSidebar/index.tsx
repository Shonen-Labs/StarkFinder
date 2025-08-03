"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Components
import EnvironmentSwitch from "../Dojo/EnvironmentSwitch";
import DojoBlocksSidebar from "../Dojo/DojoBlocksSidebar";
import CustomBlockModal from "../Modal/CustomBlock";
import { ContractSection } from "./components/ContractSection";
import { CustomBlockSection } from "./components/CustomBlockSection";

// Hooks
import { useSidebarState } from "./hooks/useSidebarState";
import { useCustomBlocks } from "./hooks/useCustomBlocks";
import { useUser } from "@/hooks/useUser";

// Utils
import { dojoBlockAdapter } from "./utils/adapters";

// Constants
import { triggerActions } from "./constants/menuItems";
import * as menuItems from "./constants/menuItems";
import { 
  greg, 
  tokenERC20Blocks,
  tokenERC20DeflationaryBlocks,
  nftERC721Blocks,
  nftERC1155Blocks,
  crowsaleICOBlocks,
  stakingBlocks,
  farmingBlocks,
  daoBlocks,
  blockchainLotteryBlocks,
  airdropMultisenderBlocks,
  multisigBlocks,
  multisigWalletBlocks,
  vestingBlocks,
  tokenLockerBlocks,
  liquidityLockerBlocks,
  erc4626VaultsBlocks
} from "./constants/blockReferences";

// Types
import { FloatingSidebarProps } from "./types";

// Icons
import StartIcon from "@/components/svgs/StartIcon";
import CoinIcon from "@/components/svgs/CoinIcon";
import CubeIcon from "@/components/svgs/CubeIcon";
import RewardIcon from "@/components/svgs/RewardIcon";
import StakeTokenIcon from "@/components/svgs/StakeTokenIcon";
import YieldFarmingIcon from "@/components/svgs/YieldFarmingIcon";
import BagIcon from "@/components/svgs/BagIcon";
import GovernanceIcon from "@/components/svgs/GovernanceIcon";
import PadlockIcon from "@/components/svgs/PadlockIcon";
import ClockIcon from "@/components/svgs/ClockIcon";
import AirdropIcon from "@/components/svgs/AirdropIcon";
import LiquidDropIcon from "@/components/svgs/LiquidDropIcon";

export default function FloatingSidebar({ addBlock }: FloatingSidebarProps) {
  const [environment, setEnvironment] = useState<"starknet" | "dojo">(
    "starknet"
  );
  const [onToggleButton, setOnToggleButton] = useState(false);
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null);
  const starknetRef = useRef<HTMLDivElement>(null);

  const { state, dispatch } = useSidebarState();
  const {
    customBlocks,
    isCustomModalOpen,
    setIsCustomModalOpen,
    onSubmitCustomBlock,
  } = useCustomBlocks(addBlock);
  const { user } = useUser(); // get user object

  // Create combined trigger actions
  const combined = triggerActions.map((action, index) => ({
    ...action,
    block: greg[index],
  }));

  useEffect(() => {
    if (starknetRef.current && environment === "starknet") {
      setSidebarHeight(starknetRef.current.scrollHeight);
    }
  }, [environment]);

  const switchToggleBtn = () => setOnToggleButton((prev) => !prev);
  const handleEnvironmentChange = (newEnvironment: "starknet" | "dojo") => {
    setEnvironment(newEnvironment);
  };

  const sidebarStyle =
    environment === "dojo" && sidebarHeight
      ? { minHeight: `${sidebarHeight}px` }
      : {};

  const currentUserId = user?.id;

  return (
    <div
      className="w-[300px] h-fit bg-white px-6 py-4 pb-12 rounded-lg shadow-lg transition-all duration-300 ease-out mb-5 text-sm"
      style={sidebarStyle}
    >
      <EnvironmentSwitch
        onChange={handleEnvironmentChange}
        defaultEnvironment="starknet"
      />

      {environment === "starknet" ? (
        <div ref={starknetRef}>
          {/* Initialize Section */}
          <div>
            <h4 className="text-gray-400">Initialize</h4>
            <div className="mt-4 flex flex-col gap-2 text-gray-400">
              <ContractSection
                title="Trigger Actions"
                icon={<StartIcon />}
                items={combined}
                blockArray={greg}
                isToggled={state.triggerActionToggle}
                toggleAction={{ type: "toggle_triggerAction" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />
            </div>
          </div>

          {/* Token Contracts Section */}
          <div className="mt-8 text-gray-400">
            <h4>Token Contracts</h4>
            <div className="mt-4 flex flex-col gap-2">
              <ContractSection
                title="Token (ERC-20)"
                icon={<CoinIcon />}
                items={menuItems.tokenERC20}
                blockArray={tokenERC20Blocks}
                isToggled={state.tokenERC20Toggle}
                toggleAction={{ type: "toggle_tokenERC20" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Token (ERC-20 Deflationary)"
                icon={<CoinIcon />}
                items={menuItems.tokenERC20Deflationary}
                blockArray={tokenERC20DeflationaryBlocks}
                isToggled={state.tokenERC20DeflationaryToggle}
                toggleAction={{ type: "toggle_tokenERC20Deflationary" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />
            </div>
          </div>

          {/* NFT Contracts Section */}
          <div className="mt-8 text-gray-400">
            <h4>NFT Contracts</h4>
            <div className="mt-4 flex flex-col gap-2">
              <ContractSection
                title="NFT Collection (ERC-721)"
                icon={<CubeIcon />}
                items={menuItems.nftERC721}
                blockArray={nftERC721Blocks}
                isToggled={state.nftERC721Toggle}
                toggleAction={{ type: "toggle_nftERC721" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="NFT Collection (ERC-1155)"
                icon={<CubeIcon />}
                items={menuItems.nftERC1155}
                blockArray={nftERC1155Blocks}
                isToggled={state.nftERC1155Toggle}
                toggleAction={{ type: "toggle_nftERC1155" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />
            </div>
          </div>

          {/* DeFi Contracts Section */}
          <div className="mt-8 text-gray-400">
            <h4>DeFi Contracts</h4>
            <div className="mt-4 flex flex-col gap-2">
              <ContractSection
                title="Crowdsale (ICO)"
                icon={<RewardIcon />}
                items={menuItems.crowsaleICO}
                blockArray={crowsaleICOBlocks}
                isToggled={state.crowsaleICOToggle}
                toggleAction={{ type: "toggle_crowsaleICO" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Staking"
                icon={<StakeTokenIcon />}
                items={menuItems.staking}
                blockArray={stakingBlocks}
                isToggled={state.stakingToggle}
                toggleAction={{ type: "toggle_staking" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Farming"
                icon={<YieldFarmingIcon />}
                items={menuItems.farming}
                blockArray={farmingBlocks}
                isToggled={state.farmingToggle}
                toggleAction={{ type: "toggle_farming" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="ERC-4626 (Tokenized Vaults)"
                icon={<BagIcon />}
                items={menuItems.erc4626Vaults}
                blockArray={erc4626VaultsBlocks}
                isToggled={state.erc4626VaultsToggle}
                toggleAction={{ type: "toggle_erc4626Vaults" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />
            </div>
          </div>

          {/* Governance & Security Section */}
          <div className="mt-8 text-gray-400">
            <h4>Governance & Security</h4>
            <div className="mt-4 flex flex-col gap-2">
              <ContractSection
                title="DAO"
                icon={<GovernanceIcon />}
                items={menuItems.dao}
                blockArray={daoBlocks}
                isToggled={state.daoToggle}
                toggleAction={{ type: "toggle_dao" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Multisig"
                icon={<PadlockIcon />}
                items={menuItems.multisig}
                blockArray={multisigBlocks}
                isToggled={state.multisigToggle}
                toggleAction={{ type: "toggle_multisig" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Multisig Wallet"
                icon={<BagIcon />}
                items={menuItems.multisigWallet}
                blockArray={multisigWalletBlocks}
                isToggled={state.multisigWalletToggle}
                toggleAction={{ type: "toggle_multisigWallet" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Vesting"
                icon={<ClockIcon />}
                items={menuItems.vesting}
                blockArray={vestingBlocks}
                isToggled={state.vestingToggle}
                toggleAction={{ type: "toggle_vesting" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />
            </div>
          </div>

          {/* Utility Contracts Section */}
          <div className="mt-8 text-gray-400">
            <h4>Utility Contracts</h4>
            <div className="mt-4 flex flex-col gap-2">
              <ContractSection
                title="Blockchain Lottery"
                icon={<RewardIcon />}
                items={menuItems.blockchainLottery}
                blockArray={blockchainLotteryBlocks}
                isToggled={state.blockchainLotteryToggle}
                toggleAction={{ type: "toggle_blockchainLottery" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="AirDrop (Multisender)"
                icon={<AirdropIcon />}
                items={menuItems.airdropMultisender}
                blockArray={airdropMultisenderBlocks}
                isToggled={state.airdropMultisenderToggle}
                toggleAction={{ type: "toggle_airdropMultisender" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Token Locker"
                icon={<PadlockIcon />}
                items={menuItems.tokenLocker}
                blockArray={tokenLockerBlocks}
                isToggled={state.tokenLockerToggle}
                toggleAction={{ type: "toggle_tokenLocker" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />

              <ContractSection
                title="Liquidity Locker"
                icon={<LiquidDropIcon />}
                items={menuItems.liquidityLocker}
                blockArray={liquidityLockerBlocks}
                isToggled={state.liquidityLockerToggle}
                toggleAction={{ type: "toggle_liquidityLocker" }}
                dispatch={dispatch}
                addBlock={addBlock}
                onToggleButton={onToggleButton}
                switchToggleBtn={switchToggleBtn}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <DojoBlocksSidebar
            addBlock={(dojoBlock) => {
              const convertedBlock = dojoBlockAdapter(dojoBlock);
              addBlock(convertedBlock);
            }}
          />
          <div className="flex-grow"></div>
        </div>
      )}

      <CustomBlockSection
        customBlocks={customBlocks}
        addBlock={addBlock}
        setIsCustomModalOpen={setIsCustomModalOpen}
      />
      {/* Navigation Links */}
      <div className="mt-4">
        <Link
          href="/devx/contracts"
          className="inline-flex justify-center py-3 w-full text-sm rounded-md bg-neutral-50 hover:bg-gray-200 font-medium"
        >
          Contracts
        </Link>
      </div>
      <Link
        href="/devx/resources"
        className="inline-flex justify-center py-3 w-full text-sm rounded-md bg-neutral-50 hover:bg-gray-200 font-medium"
      >
        Resources
      </Link>

      <Link
        href={currentUserId ? `/devx/profile/${currentUserId}` : "/devx/profile"}
        className="inline-flex justify-center py-3 w-full text-sm rounded-md bg-neutral-50 hover:bg-gray-200 font-medium"
      >
        Profile
      </Link>

      <CustomBlockModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={onSubmitCustomBlock}
        environment={environment}
      />
    </div>
  );
}
