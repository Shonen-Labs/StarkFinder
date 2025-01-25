import {
    ArrowRightLeft,
    Banknote,
    BarChart3,
    Briefcase,
    ChartLine,
    Clock,
    Coins,
    Droplets,
    Fan,
    Flag,
    Gift,
    HandCoins,
    History,
    Landmark,
    LockKeyhole,
    MessageSquare,
    Package,
    PiggyBank,
    Plane,
    Power,
    Sprout,
    Tractor,
    TrendingDown,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';

const blockTypes = [
    // Trigger Actions
    { id: 'start', content: 'Upon Initialise', color: 'bg-[#451805]', borderColor: 'border-[#8A5035]', hoverBorderColor: 'hover:border-[#BE5B2A]', icon: Flag },
    { id: 'end', content: 'Disconnect', color: 'bg-[#451805]', borderColor: 'border-[#8A5035]', hoverBorderColor: 'hover:border-[#BE5B2A]', icon: Power },

    // Token Actions
    { id: 'swap', content: 'Swap Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: ArrowRightLeft },
    { id: 'stake', content: 'Stake Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Landmark },
    { id: 'allocate', content: 'Allocate Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: HandCoins },
    { id: 'startYieldFarming', content: 'Start Yield Farming', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Sprout },
    { id: 'stopYieldFarming', content: 'Stop Yield Farming', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Tractor },
    { id: 'lendTokens', content: 'Lend Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: PiggyBank },
    { id: 'borrowTokens', content: 'Borrow Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Coins },
    { id: 'repayLoan', content: 'Repay Loan', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Banknote },
    { id: 'claimTokens', content: 'Claim Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Gift },

    // Liquidity
    { id: 'liquidity', content: 'Add Liquidity', color: 'bg-[#17273E]', borderColor: 'border-[#2F5B87]', hoverBorderColor: 'hover:border-[#87C6E0]', icon: Droplets },
    { id: 'createStakingPool', content: 'Create Staking Pool', color: 'bg-[#17273E]', borderColor: 'border-[#2F5B87]', hoverBorderColor: 'hover:border-[#87C6E0]', icon: Users },

    // Portfolio Management
    { id: 'rebalancePortfolio', content: 'Rebalance Portfolio', color: 'bg-[#2F1E3A]', borderColor: 'border-[#472A56]', hoverBorderColor: 'hover:border-[#663E7D]', icon: BarChart3 },
    { id: 'setRebalanceFrequency', content: 'Set Rebalance Frequency', color: 'bg-[#2F1E3A]', borderColor: 'border-[#472A56]', hoverBorderColor: 'hover:border-[#663E7D]', icon: Clock },
    { id: 'createCustomIndex', content: 'Create Custom Index', color: 'bg-[#2F1E3A]', borderColor: 'border-[#472A56]', hoverBorderColor: 'hover:border-[#663E7D]', icon: Package },
    { id: 'setStopLoss', content: 'Set Stop Loss', color: 'bg-[#2F1E3A]', borderColor: 'border-[#472A56]', hoverBorderColor: 'hover:border-[#663E7D]', icon: TrendingDown },
    { id: 'setTakeProfit', content: 'Set Take Profit', color: 'bg-[#2F1E3A]', borderColor: 'border-[#472A56]', hoverBorderColor: 'hover:border-[#663E7D]', icon: TrendingUp },
    { id: 'setStrategy', content: 'Set Strategy', color: 'bg-[#2F1E3A]', borderColor: 'border-[#472A56]', hoverBorderColor: 'hover:border-[#663E7D]', icon: Briefcase },

    // Governance
    { id: 'governance', content: 'Vote on Proposal', color: 'bg-[#21173E]', borderColor: 'border-[#35285B]', hoverBorderColor: 'hover:border-[#A57BBE]', icon: MessageSquare },
    { id: 'createVesting', content: 'Create Vesting', color: 'bg-[#21173E]', borderColor: 'border-[#35285B]', hoverBorderColor: 'hover:border-[#A57BBE]', icon: LockKeyhole },

    // Events
    { id: 'event', content: 'On Event Outcome', color: 'bg-[#4A0505]', borderColor: 'border-[#791919]', hoverBorderColor: 'hover:border-[#BC2F2F]', icon: Fan },
    { id: 'executeFlashLoan', content: 'Execute Flash Loan', color: 'bg-[#4A0505]', borderColor: 'border-[#791919]', hoverBorderColor: 'hover:border-[#BC2F2F]', icon: Zap },
    { id: 'initiateAirdrop', content: 'Initiate Airdrop', color: 'bg-[#4A0505]', borderColor: 'border-[#791919]', hoverBorderColor: 'hover:border-[#BC2F2F]', icon: Plane },

    // Analytics
    { id: 'getTransactionHistory', content: 'Get Transaction History', color: 'bg-[#1E3A3A]', borderColor: 'border-[#2A5656]', hoverBorderColor: 'hover:border-[#3E7D7D]', icon: History },
    { id: 'getPortfolioAnalytics', content: 'Get Portfolio Analytics', color: 'bg-[#1E3A3A]', borderColor: 'border-[#2A5656]', hoverBorderColor: 'hover:border-[#3E7D7D]', icon: ChartLine },
]

// Group blocks into categories for the sidebar
const groupedBlocks = {
    "Trigger Actions": blockTypes.filter(block => ['start', 'end', 'disconnect', 'initialise'].includes(block.id)),
    "Token Actions": blockTypes.filter(block => ['swap', 'stake', 'allocate', 'startYieldFarming', 'stopYieldFarming', 'lendTokens', 'borrowTokens', 'repayLoan', 'claimTokens'].includes(block.id)),
    "Liquidity": blockTypes.filter(block => ['liquidity', 'createStakingPool'].includes(block.id)),
    "Portfolio Management": blockTypes.filter(block => ['rebalancePortfolio', 'setRebalanceFrequency', 'createCustomIndex', 'setStopLoss', 'setTakeProfit', 'setStrategy'].includes(block.id)),
    "Governance": blockTypes.filter(block => ['governance', 'createVesting'].includes(block.id)),
    "Events": blockTypes.filter(block => ['event', 'executeFlashLoan', 'initiateAirdrop'].includes(block.id)),
    "Analytics": blockTypes.filter(block => ['getTransactionHistory', 'getPortfolioAnalytics'].includes(block.id)),
    "Custom": blockTypes.filter(block => ['custom'].includes(block.id)),
}

export default groupedBlocks;