import { LayerswapClient } from '../client/dist/lib/layerswap/client.js';
import { BridgeHandler } from '../client/dist/lib/transaction/handlers/bridge.js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: resolve(__dirname, '../client/.env') });

async function testLayerswapBridge() {
  try {
    const apiKey = process.env.LAYERSWAP_API_KEY;
    if (!apiKey) {
      throw new Error('LAYERSWAP_API_KEY is required in environment variables');
    }

    console.log('Testing Layerswap bridge functionality...');

    // Initialize the bridge handler
    const bridgeHandler = new BridgeHandler(apiKey);

    // Test data
    const testData = {
      bridge: {
        sourceNetwork: 'starknet_mainnet',
        destinationNetwork: 'ethereum_mainnet',
        sourceToken: 'ETH',
        destinationToken: 'ETH',
        amount: 0.1,
        sourceAddress: '0x1234567890123456789012345678901234567890',
        destinationAddress: '0x1234567890123456789012345678901234567890'
      }
    };

    // Process the bridge request
    console.log('Sending bridge request...');
    const steps = await bridgeHandler.processSteps(testData, {
      chain: 'starknet',
      dest_chain: 'ethereum',
      token1: 'ETH',
      token2: 'ETH',
      amount: '0.1',
      address: '0x1234567890123456789012345678901234567890'
    });

    console.log('Bridge steps generated successfully:', JSON.stringify(steps, null, 2));
    return true;
  } catch (error) {
    console.error('Bridge test failed:', error);
    return false;
  }
}

// Run the test
testLayerswapBridge().then((success) => {
  if (success) {
    console.log('✅ Bridge test completed successfully');
  } else {
    console.log('❌ Bridge test failed');
    process.exit(1);
  }
});
