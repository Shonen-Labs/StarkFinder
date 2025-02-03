import { LayerswapClient } from "../client/lib/layerswap/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { captureScreenshots } from "./capture-bridge-screenshots";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../client/.env") });

async function testBridge() {
  try {
    const client = new LayerswapClient(process.env.LAYERSWAP_API_KEY || "");
    
    // Test parameters
    const testParams = {
      sourceNetwork: "starknet_mainnet",
      destinationNetwork: "ethereum_mainnet",
      sourceToken: "ETH",
      destinationToken: "ETH",
      amount: 0.05,
      sourceAddress: process.env.NEXT_PUBLIC_TEST_WALLET_ADDRESS || "",
      destinationAddress: process.env.NEXT_PUBLIC_TEST_WALLET_ADDRESS || "",
    };

    console.log("Starting bridge test with parameters:", testParams);

    // 1. Check available routes
    console.log("\nChecking available routes...");
    const routes = await client.getAvailableRoutes();
    console.log("Available routes:", routes);

    // 2. Create bridge transaction
    console.log("\nCreating bridge transaction...");
    const bridgeResult = await client.createSwap({
      sourceNetwork: testParams.sourceNetwork,
      destinationNetwork: testParams.destinationNetwork,
      sourceToken: testParams.sourceToken,
      destinationToken: testParams.destinationToken,
      amount: testParams.amount,
      sourceAddress: testParams.sourceAddress,
      destinationAddress: testParams.destinationAddress,
    });

    console.log("\nBridge transaction created:", bridgeResult);

    // 3. Get transaction status
    console.log("\nChecking transaction status...");
    const status = await client.getSwapStatus(bridgeResult.swapId);
    console.log("Transaction status:", status);

    // 4. Capture screenshots
    console.log("\nCapturing screenshots...");
    await captureScreenshots(bridgeResult.layerswapUrl);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const results = {
      timestamp,
      parameters: testParams,
      routes,
      bridgeResult,
      status,
    };

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, "../docs/screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Save test results
    fs.writeFileSync(
      path.join(screenshotsDir, `bridge-test-${timestamp}.json`),
      JSON.stringify(results, null, 2)
    );

    // Generate markdown documentation
    const markdown = `# Bridge Test Results (${timestamp})

## Test Parameters
\`\`\`json
${JSON.stringify(testParams, null, 2)}
\`\`\`

## Bridge Transaction
- Transaction ID: ${bridgeResult.swapId}
- Status: ${status.status}
- Transaction URL: ${bridgeResult.layerswapUrl}

## Available Routes
\`\`\`json
${JSON.stringify(routes, null, 2)}
\`\`\`

## Full Response
\`\`\`json
${JSON.stringify(bridgeResult, null, 2)}
\`\`\`

## Screenshots
![Bridge Transaction](bridge-transaction-${timestamp}.png)
![Bridge Status](bridge-status-${timestamp}.png)
`;

    fs.writeFileSync(
      path.join(screenshotsDir, `bridge-test-${timestamp}.md`),
      markdown
    );

    console.log(`\nTest results saved to docs/screenshots/bridge-test-${timestamp}.md`);
    console.log(`Transaction URL: ${bridgeResult.layerswapUrl}`);
    
    return {
      success: true,
      transactionUrl: bridgeResult.layerswapUrl,
      documentationPath: `docs/screenshots/bridge-test-${timestamp}.md`,
    };
  } catch (error) {
    console.error("Bridge test failed:", error);
    throw error;
  }
}

// Run the test
testBridge().catch(console.error);
