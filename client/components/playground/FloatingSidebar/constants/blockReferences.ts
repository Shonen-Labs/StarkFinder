import groupedBlocks from "../data"

// Existing block arrays
export const greg = groupedBlocks["Trigger Actions"]
export const token = groupedBlocks["Token Actions"]
export const li = groupedBlocks["Liquidity"]
export const po = groupedBlocks["Portfolio Management"]
export const inst = groupedBlocks["Analytics"]
export const go = groupedBlocks["Governance"]
export const ev = groupedBlocks["Events"]
export const commonFunctions = groupedBlocks["Common Functions"]

// Create specific block arrays for menu items
// Each block array should match the corresponding menu items

// Token ERC20 blocks - matching tokenERC20 menu items
export const tokenERC20Blocks = [
  token.find(b => b.id === "mintTokens"),
  token.find(b => b.id === "burnTokens"), 
  token.find(b => b.id === "transferTokens"),
  commonFunctions.find(b => b.id === "approveSpending"),
  // Create placeholder blocks for missing functionality
  { id: "setTokenPrice", content: "Set Token Price", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "tokenBalanceCheck", content: "Token Balance Check", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon },
  { id: "setTransferLimits", content: "Set Transfer Limits", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon }
].filter(Boolean)

// Token ERC20 Deflationary blocks
export const tokenERC20DeflationaryBlocks = [
  { id: "autoBurnOnTransfer", content: "Auto Burn on Transfer", color: "bg-[#322131]", borderColor: "border-[#663B6A]", hoverBorderColor: "hover:border-[#FB6A9E]", icon: token[0].icon },
  token.find(b => b.id === "burnTokens"),
  { id: "setBurnRate", content: "Set Burn Rate", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "burnEventTracking", content: "Burn Event Tracking", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon },
  { id: "setTransactionFees", content: "Set Transaction Fees", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "feeDistribution", content: "Fee Distribution", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon }
].filter(Boolean)

// NFT ERC721 blocks
export const nftERC721Blocks = [
  { id: "mintNFT", content: "Mint NFT", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: token[0].icon },
  { id: "setNFTMetadata", content: "Set NFT Metadata", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "transferNFT", content: "Transfer NFT", color: "bg-[#17273E]", borderColor: "border-[#2F5B87]", hoverBorderColor: "hover:border-[#4C86C1]", icon: token[0].icon },
  { id: "burnNFT", content: "Burn NFT", color: "bg-[#322131]", borderColor: "border-[#663B6A]", hoverBorderColor: "hover:border-[#FB6A9E]", icon: token[0].icon },
  { id: "setRoyaltyFee", content: "Set Royalty Fee", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "batchMintNFTs", content: "Batch Mint NFTs", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: token[0].icon }
]

// NFT ERC1155 blocks
export const nftERC1155Blocks = [
  { id: "mintTokenBatch", content: "Mint Token Batch", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: token[0].icon },
  { id: "setTokenSupply", content: "Set Token Supply", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "burnTokenBatch", content: "Burn Token Batch", color: "bg-[#322131]", borderColor: "border-[#663B6A]", hoverBorderColor: "hover:border-[#FB6A9E]", icon: token[0].icon },
  { id: "setIndividualPrices", content: "Set Individual Prices", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "batchTransfer", content: "Batch Transfer", color: "bg-[#17273E]", borderColor: "border-[#2F5B87]", hoverBorderColor: "hover:border-[#4C86C1]", icon: token[0].icon },
  { id: "setTokenMetadata", content: "Set Token Metadata", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon }
]

// Continue with other block arrays matching the menu structure
export const crowsaleICOBlocks = [
  { id: "createCampaign", content: "Create Campaign", color: "bg-[#451805]", borderColor: "border-[#8A5035]", hoverBorderColor: "hover:border-[#BE5B2A]", icon: greg[0].icon },
  { id: "setSaleTimeline", content: "Set Sale Timeline", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "setTokenPrice", content: "Set Token Price", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "acceptPayments", content: "Accept Payments", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  token.find(b => b.id === "allocate"),
  { id: "refundContributors", content: "Refund Contributors", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon }
].filter(Boolean)

export const stakingBlocks = [
  token.find(b => b.id === "stake"),
  token.find(b => b.id === "stopYieldFarming"), // Use as "stop staking"
  token.find(b => b.id === "claimTokens"),
  li.find(b => b.id === "createStakingPool"),
  { id: "updateRewardRate", content: "Update Reward Rate", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "calculateRewards", content: "Calculate Rewards", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon }
].filter(Boolean)

export const farmingBlocks = [
  { id: "createFarm", content: "Create Farm", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  li.find(b => b.id === "liquidity"), // Use as "Add Liquidity to Farm"
  { id: "removeLiquidityFromFarm", content: "Remove Liquidity from Farm", color: "bg-[#17273E]", borderColor: "border-[#2F5B87]", hoverBorderColor: "hover:border-[#87C6E0]", icon: li[0].icon },
  token.find(b => b.id === "claimTokens"), // Use as "Harvest Rewards"
  { id: "setFarmMultipliers", content: "Set Farm Multipliers", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "lpTokenStaking", content: "LP Token Staking", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon }
].filter(Boolean)

// DAO blocks
export const daoBlocks = [
  { id: "createProposal", content: "Create Proposal", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon },
  go.find(b => b.id === "governance"), // Use as "Vote on Proposal"
  { id: "executeProposal", content: "Execute Proposal", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon },
  { id: "delegateVotingPower", content: "Delegate Voting Power", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon },
  { id: "setVotingParameters", content: "Set Voting Parameters", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "treasuryManagement", content: "Treasury Management", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon }
].filter(Boolean)

// Blockchain Lottery blocks
export const blockchainLotteryBlocks = [
  { id: "createLottery", content: "Create Lottery", color: "bg-[#451805]", borderColor: "border-[#8A5035]", hoverBorderColor: "hover:border-[#BE5B2A]", icon: greg[0].icon },
  { id: "buyTicket", content: "Buy Ticket", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "generateRandomWinner", content: "Generate Random Winner", color: "bg-[#4A0505]", borderColor: "border-[#791919]", hoverBorderColor: "hover:border-[#BC2F2F]", icon: ev[0].icon },
  token.find(b => b.id === "allocate"), // Use as "Distribute Prizes"
  { id: "setTicketPrice", content: "Set Ticket Price", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "setPrizeStructure", content: "Set Prize Structure", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon }
].filter(Boolean)

// Airdrop Multisender blocks
export const airdropMultisenderBlocks = [
  ev.find(b => b.id === "initiateAirdrop"), // Use as "Bulk Send Tokens"
  { id: "csvImportRecipients", content: "CSV Import Recipients", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon },
  { id: "setDistributionRules", content: "Set Distribution Rules", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "merkleTreeAirdrop", content: "Merkle Tree Airdrop", color: "bg-[#4A0505]", borderColor: "border-[#791919]", hoverBorderColor: "hover:border-[#BC2F2F]", icon: ev[0].icon },
  token.find(b => b.id === "claimTokens"),
  { id: "whitelistRecipients", content: "Whitelist Recipients", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon }
].filter(Boolean)

// Multisig blocks
export const multisigBlocks = [
  { id: "createMultisigWallet", content: "Create Multisig Wallet", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: commonFunctions[0].icon },
  { id: "addSigners", content: "Add Signers", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon },
  { id: "removeSigners", content: "Remove Signers", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon },
  { id: "setSignatureThreshold", content: "Set Signature Threshold", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "proposeTransaction", content: "Propose Transaction", color: "bg-[#17273E]", borderColor: "border-[#2F5B87]", hoverBorderColor: "hover:border-[#4C86C1]", icon: token[0].icon },
  { id: "approveTransaction", content: "Approve Transaction", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon }
].filter(Boolean)

// Multisig Wallet blocks
export const multisigWalletBlocks = [
  { id: "walletBalanceDisplay", content: "Wallet Balance Display", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon },
  { id: "multiAssetSupport", content: "Multi-Asset Support", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: token[0].icon },
  { id: "spendingLimits", content: "Spending Limits", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "recurringPayments", content: "Recurring Payments", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "budgetManagement", content: "Budget Management", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon },
  { id: "contactManagement", content: "Contact Management", color: "bg-[#21173E]", borderColor: "border-[#35285B]", hoverBorderColor: "hover:border-[#A57BBE]", icon: go[0].icon }
].filter(Boolean)

// Vesting blocks
export const vestingBlocks = [
  go.find(b => b.id === "createVesting"),
  { id: "linearVestingRelease", content: "Linear Vesting Release", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "cliffVesting", content: "Cliff Vesting", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: commonFunctions[0].icon },
  { id: "releaseTokens", content: "Release Tokens", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "revokeVesting", content: "Revoke Vesting", color: "bg-[#322131]", borderColor: "border-[#663B6A]", hoverBorderColor: "hover:border-[#FB6A9E]", icon: token[0].icon },
  { id: "setVestingParameters", content: "Set Vesting Parameters", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon }
].filter(Boolean)

// Token Locker blocks
export const tokenLockerBlocks = [
  { id: "lockTokens", content: "Lock Tokens", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: commonFunctions[0].icon },
  { id: "setLockDuration", content: "Set Lock Duration", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "unlockTokens", content: "Unlock Tokens", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: commonFunctions[0].icon },
  { id: "extendLockPeriod", content: "Extend Lock Period", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "emergencyUnlock", content: "Emergency Unlock", color: "bg-[#4A0505]", borderColor: "border-[#791919]", hoverBorderColor: "hover:border-[#BC2F2F]", icon: ev[0].icon },
  { id: "lockAnalytics", content: "Lock Analytics", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon }
].filter(Boolean)

// Liquidity Locker blocks
export const liquidityLockerBlocks = [
  { id: "lockLPTokens", content: "Lock LP Tokens", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: commonFunctions[0].icon },
  { id: "setLiquidityLockDuration", content: "Set Liquidity Lock Duration", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "unlockLPTokens", content: "Unlock LP Tokens", color: "bg-[#17273E]", borderColor: "border-[#2F5B87]", hoverBorderColor: "hover:border-[#87C6E0]", icon: li[0].icon },
  { id: "lockVerification", content: "Lock Verification", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon },
  { id: "extendLiquidityLock", content: "Extend Liquidity Lock", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  { id: "lpLockAnalytics", content: "LP Lock Analytics", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon }
].filter(Boolean)

// ERC4626 Vaults blocks
export const erc4626VaultsBlocks = [
  { id: "createVault", content: "Create Vault", color: "bg-[#2F1E3A]", borderColor: "border-[#472A56]", hoverBorderColor: "hover:border-[#663E7D]", icon: po[0].icon },
  commonFunctions.find(b => b.id === "depositFunds"), // Use as "Deposit Funds"
  commonFunctions.find(b => b.id === "withdrawFunds"), // Use as "Withdraw Funds"
  { id: "mintVaultShares", content: "Mint Vault Shares", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: token[0].icon },
  { id: "redeemVaultShares", content: "Redeem Vault Shares", color: "bg-[#142321]", borderColor: "border-[#245C3D]", hoverBorderColor: "hover:border-[#6AFB8E]", icon: token[0].icon },
  { id: "calculateSharePrice", content: "Calculate Share Price", color: "bg-[#1E3A3A]", borderColor: "border-[#2A5656]", hoverBorderColor: "hover:border-[#3E7D7D]", icon: inst[0].icon }
].filter(Boolean)
