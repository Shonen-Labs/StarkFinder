import { NOSTRA_TOKENS } from './transaction/config';

// ERC20 ABI for balance checking
export const ERC20_ABI = [
  {
    "name": "balanceOf",
    "type": "function",
    "inputs": [
      {
        "name": "account",
        "type": "felt"
      }
    ],
    "outputs": [
      {
        "name": "balance",
        "type": "Uint256"
      }
    ],
    "stateMutability": "view"
  }
];

// Get the token contract for balance checking
export const getTokenContract = (tokenAddress: string) => {
  return {
    abi: ERC20_ABI,
    address: tokenAddress,
  };
};

// Convert amount to wei (18 decimals) with safety margin
export const toSafeWeiAmount = (amount: string, safetyMargin: number = 0.99): string => {
  const safeAmount = parseFloat(amount) * safetyMargin;
  return (BigInt(Math.floor(safeAmount * 10 ** 18))).toString();
};

// Convert Uint256 result to decimal string
export const parseUint256ToDecimal = (result: string[]): string => {
  if (!result || result.length < 2) return "0";
  
  try {
    const low = BigInt(result[0]);
    const high = BigInt(result[1]);
    const balance = (high << 128n) + low;
    const balanceInEther = Number(balance) / 10**18;
    return balanceInEther.toFixed(6);
  } catch (err) {
    console.error("Error parsing Uint256:", err);
    return "0";
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Fetch token balance
export const fetchTokenBalance = async (
  account: any, 
  address: string, 
  tokenName: string, 
  isInterestBearing: boolean = false
): Promise<string> => {
  if (!address || !account || !tokenName) return "0";
  
  try {
    const tokenKey = tokenName.toLowerCase();
    const tokenAddresses = NOSTRA_TOKENS[tokenKey as keyof typeof NOSTRA_TOKENS];
    
    if (!tokenAddresses) {
      return "0";
    }
    
    // Use iToken address for interest bearing tokens (withdrawals)
    const contractAddress = isInterestBearing ? tokenAddresses.iToken : tokenAddresses.token;
    
    const result = await account.callContract({
      contractAddress,
      entrypoint: 'balanceOf',
      calldata: [address]
    });
    
    return parseUint256ToDecimal(result);
  } catch (err) {
    console.error("Error fetching balance:", err);
    return "0";
  }
};

// Create Nostra deposit transaction
export const createDepositTransaction = (
  tokenName: string, 
  amount: string, 
  userAddress: string
): Array<{contractAddress: string, entrypoint: string, calldata: string[]}> => {
  const tokenKey = tokenName.toLowerCase();
  const tokenAddresses = NOSTRA_TOKENS[tokenKey as keyof typeof NOSTRA_TOKENS];
  
  if (!tokenAddresses) {
    throw new Error(`Unsupported token for Nostra deposit: ${tokenName}`);
  }
  
  const amountWithDecimals = toSafeWeiAmount(amount);
  
  return [
    {
      contractAddress: tokenAddresses.token,
      entrypoint: 'approve',
      calldata: [tokenAddresses.iToken, amountWithDecimals, '0']
    },
    {
      contractAddress: tokenAddresses.iToken,
      entrypoint: 'mint',
      calldata: [userAddress, amountWithDecimals, '0']
    }
  ];
};

// Create Nostra withdraw transaction
export const createWithdrawTransaction = (
  tokenName: string, 
  amount: string, 
  userAddress: string
): Array<{contractAddress: string, entrypoint: string, calldata: string[]}> => {
  const tokenKey = tokenName.toLowerCase();
  const tokenAddresses = NOSTRA_TOKENS[tokenKey as keyof typeof NOSTRA_TOKENS];
  
  if (!tokenAddresses) {
    throw new Error(`Unsupported token for Nostra withdraw: ${tokenName}`);
  }
  
  const amountWithDecimals = toSafeWeiAmount(amount);
  
  return [
    {
      contractAddress: tokenAddresses.iToken,
      entrypoint: 'burn',
      calldata: [
        userAddress,
        userAddress,
        amountWithDecimals,
        '0'
      ]
    }
  ];
}; 