import { useReducer } from "react";
import { ToggleState, ToggleAction } from "../types";

const initialState: ToggleState = {
  triggerActionToggle: false,
  tokenERC20Toggle: false,
  tokenERC20DeflationaryToggle: false,
  nftERC721Toggle: false,
  nftERC1155Toggle: false,
  crowsaleICOToggle: false,
  daoToggle: false,
  blockchainLotteryToggle: false,
  airdropMultisenderToggle: false,
  multisigToggle: false,
  multisigWalletToggle: false,
  vestingToggle: false,
  stakingToggle: false,
  farmingToggle: false,
  tokenLockerToggle: false,
  liquidityLockerToggle: false,
  erc4626VaultsToggle: false,
};

function toggleReducer(state: ToggleState, action: ToggleAction): ToggleState {
  switch (action.type) {
    case "toggle_triggerAction":
      return { ...initialState, triggerActionToggle: !state.triggerActionToggle };
    case "toggle_tokenERC20":
      return { ...initialState, tokenERC20Toggle: !state.tokenERC20Toggle };
    case "toggle_tokenERC20Deflationary":
      return { ...initialState, tokenERC20DeflationaryToggle: !state.tokenERC20DeflationaryToggle };
    case "toggle_nftERC721":
      return { ...initialState, nftERC721Toggle: !state.nftERC721Toggle };
    case "toggle_nftERC1155":
      return { ...initialState, nftERC1155Toggle: !state.nftERC1155Toggle };
    case "toggle_crowsaleICO":
      return { ...initialState, crowsaleICOToggle: !state.crowsaleICOToggle };
    case "toggle_dao":
      return { ...initialState, daoToggle: !state.daoToggle };
    case "toggle_blockchainLottery":
      return { ...initialState, blockchainLotteryToggle: !state.blockchainLotteryToggle };
    case "toggle_airdropMultisender":
      return { ...initialState, airdropMultisenderToggle: !state.airdropMultisenderToggle };
    case "toggle_multisig":
      return { ...initialState, multisigToggle: !state.multisigToggle };
    case "toggle_multisigWallet":
      return { ...initialState, multisigWalletToggle: !state.multisigWalletToggle };
    case "toggle_vesting":
      return { ...initialState, vestingToggle: !state.vestingToggle };
    case "toggle_staking":
      return { ...initialState, stakingToggle: !state.stakingToggle };
    case "toggle_farming":
      return { ...initialState, farmingToggle: !state.farmingToggle };
    case "toggle_tokenLocker":
      return { ...initialState, tokenLockerToggle: !state.tokenLockerToggle };
    case "toggle_liquidityLocker":
      return { ...initialState, liquidityLockerToggle: !state.liquidityLockerToggle };
    case "toggle_erc4626Vaults":
      return { ...initialState, erc4626VaultsToggle: !state.erc4626VaultsToggle };
    default:
      return initialState;
  }
}

export const useSidebarState = () => {
  const [state, dispatch] = useReducer(toggleReducer, initialState);
  return { state, dispatch };
};
