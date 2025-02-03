import { CoinsLogo } from "../client/types/crypto-coin";

// Mock bridge interface
function mockBridgeTransaction(fromAmount: string, fromCoin: any, toCoin: any) {
  console.log("\n=== Bridge Transaction Details ===");
  console.log(`Amount: ${fromAmount} ${fromCoin.name}`);
  console.log(`From Network: ${fromCoin.network}`);
  console.log(`To Network: ${toCoin.network}`);
  console.log(`Source Token: ${fromCoin.name} (${fromCoin.symbol})`);
  console.log(`Destination Token: ${toCoin.name} (${toCoin.symbol})`);
  console.log("================================\n");
}

// Test the bridge interface
function testBridgeInterface() {
  const fromCoin = CoinsLogo[0]; // ETH on Starknet
  const toCoin = CoinsLogo[3];   // ETH on Ethereum
  const amount = "0.05";

  console.log("Testing Bridge Interface");
  console.log("------------------------");
  
  // Test valid bridge transaction
  mockBridgeTransaction(amount, fromCoin, toCoin);
  
  // Test invalid amount (too low)
  console.log("Testing invalid amount (too low):");
  mockBridgeTransaction("0.001", fromCoin, toCoin);
  
  // Test invalid amount (too high)
  console.log("Testing invalid amount (too high):");
  mockBridgeTransaction("2000", fromCoin, toCoin);
}

testBridgeInterface();
