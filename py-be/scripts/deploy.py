#!/usr/bin/env python3
"""
Deployment script for Parametric Insurance Pool
StarkFinder EthGlobal AI Web3 Hackathon
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

from starknet_py.net.account.account import Account
from starknet_py.net.client_models import Call
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.models.chains import StarknetChainId
from starknet_py.net.signer.stark_curve_signer import KeyPair


class InsurancePoolDeployer:
    """Handles deployment of the parametric insurance pool system."""

    def __init__(self, network: str = "sepolia"):
        self.network = network
        self.setup_network_config()

    def setup_network_config(self):
        """Configure network-specific settings."""
        network_configs = {
            "sepolia": {
                "node_url": "https://starknet-sepolia.public.blastapi.io",
                "chain_id": StarknetChainId.SEPOLIA,
                "explorer_url": "https://sepolia.starkscan.co",
            },
            "mainnet": {
                "node_url": "https://starknet-mainnet.public.blastapi.io",
                "chain_id": StarknetChainId.MAINNET,
                "explorer_url": "https://starkscan.co",
            },
        }

        if self.network not in network_configs:
            raise ValueError(f"Unsupported network: {self.network}")

        self.config = network_configs[self.network]
        print(f"🌐 Configured for {self.network} network")

    async def setup_account(self) -> Account:
        """Initialize Starknet account for deployment."""
        private_key = os.getenv("STARKNET_PRIVATE_KEY")
        account_address = os.getenv("STARKNET_ACCOUNT_ADDRESS")

        if not private_key or not account_address:
            raise ValueError(
                "Please set STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS environment variables"
            )

        print(f"🔑 Setting up account: {account_address}")

        client = FullNodeClient(node_url=self.config["node_url"])
        key_pair = KeyPair.from_private_key(int(private_key, 16))

        account = Account(
            client=client,
            address=int(account_address, 16),
            key_pair=key_pair,
            chain=self.config["chain_id"],
        )

        return account

    def load_contract_artifacts(self) -> Dict:
        """Load compiled contract artifacts."""
        contracts_dir = Path(__file__).parent.parent / "contracts" / "target" / "dev"

        artifacts = {}
        contract_files = [
            ("MockERC20", "parametric_insurance_pool_MockERC20.sierra.json"),
            ("MockOracle", "parametric_insurance_pool_MockOracle.sierra.json"),
            (
                "OracleIntegration",
                "parametric_insurance_pool_OracleIntegration.sierra.json",
            ),
            (
                "ParametricInsurancePool",
                "parametric_insurance_pool_ParametricInsurancePool.sierra.json",
            ),
        ]

        for contract_name, filename in contract_files:
            file_path = contracts_dir / filename
            if not file_path.exists():
                raise FileNotFoundError(f"Contract artifact not found: {file_path}")

            with open(file_path, "r") as f:
                artifacts[contract_name] = json.load(f)
                print(f"📄 Loaded {contract_name} artifact")

        return artifacts

    async def deploy_mock_token(self, account: Account, artifacts: Dict) -> int:
        """Deploy mock ERC20 token for testing."""
        print("📦 Deploying Mock ERC20 Token...")

        # Token configuration
        name = "Mock USDC"
        symbol = "mUSDC"
        decimals = 6
        initial_supply = 1_000_000_000_000  # 1M tokens with 6 decimals

        # Prepare constructor calldata
        constructor_calldata = [
            len(name.encode()),  # name length
            *[int(c) for c in name.encode()],  # name bytes
            len(symbol.encode()),  # symbol length
            *[int(c) for c in symbol.encode()],  # symbol bytes
            decimals,
            initial_supply,
            0,  # Supply high part (u256)
            account.address,
        ]

        # Deploy contract
        deploy_result = await account.deploy_contract(
            compilation_source=artifacts["MockERC20"],
            constructor_calldata=constructor_calldata,
        )

        await deploy_result.wait_for_acceptance()
        token_address = deploy_result.deployed_contract_address

        print(f"✅ Mock Token deployed at: {hex(token_address)}")
        print(f"   Name: {name}")
        print(f"   Symbol: {symbol}")
        print(f"   Decimals: {decimals}")
        print(f"   Initial Supply: {initial_supply:,}")

        return token_address

    async def deploy_mock_oracle(self, account: Account, artifacts: Dict) -> int:
        """Deploy mock oracle for testing."""
        print("📦 Deploying Mock Oracle...")

        constructor_calldata = [account.address]

        deploy_result = await account.deploy_contract(
            compilation_source=artifacts["MockOracle"],
            constructor_calldata=constructor_calldata,
        )

        await deploy_result.wait_for_acceptance()
        oracle_address = deploy_result.deployed_contract_address

        print(f"✅ Mock Oracle deployed at: {hex(oracle_address)}")

        return oracle_address

    async def deploy_oracle_integration(self, account: Account, artifacts: Dict) -> int:
        """Deploy oracle integration contract."""
        print("📦 Deploying Oracle Integration...")

        constructor_calldata = [account.address]

        deploy_result = await account.deploy_contract(
            compilation_source=artifacts["OracleIntegration"],
            constructor_calldata=constructor_calldata,
        )

        await deploy_result.wait_for_acceptance()
        integration_address = deploy_result.deployed_contract_address

        print(f"✅ Oracle Integration deployed at: {hex(integration_address)}")

        return integration_address

    async def deploy_insurance_pool(
        self, account: Account, artifacts: Dict, token_address: int
    ) -> int:
        """Deploy the main parametric insurance pool."""
        print("📦 Deploying Parametric Insurance Pool...")

        # Pool configuration
        base_premium_rate = 500  # 5% in basis points
        liquidity_reward_rate = 1000  # 10% annual in basis points

        constructor_calldata = [
            account.address,  # owner
            token_address,  # payment token
            base_premium_rate,  # base premium rate
            0,  # base premium rate high part (u256)
            liquidity_reward_rate,  # liquidity reward rate
            0,  # liquidity reward rate high part (u256)
        ]

        deploy_result = await account.deploy_contract(
            compilation_source=artifacts["ParametricInsurancePool"],
            constructor_calldata=constructor_calldata,
        )

        await deploy_result.wait_for_acceptance()
        pool_address = deploy_result.deployed_contract_address

        print(f"✅ Insurance Pool deployed at: {hex(pool_address)}")
        print(f"   Base Premium Rate: {base_premium_rate/100}%")
        print(f"   Liquidity Reward Rate: {liquidity_reward_rate/100}% annual")

        return pool_address

    async def configure_system(
        self,
        account: Account,
        pool_address: int,
        oracle_address: int,
        integration_address: int,
    ):
        """Configure the insurance system after deployment."""
        print("⚙️ Configuring system...")

        calls = []

        # Authorize oracle in insurance pool
        calls.append(
            Call(
                to_addr=pool_address,
                selector="authorize_oracle",
                calldata=[oracle_address],
            )
        )

        # Register oracle in integration contract
        data_types = [1, 2, 3, 4, 10, 20, 30]  # All supported data types
        calls.append(
            Call(
                to_addr=integration_address,
                selector="register_oracle",
                calldata=[oracle_address, len(data_types)] + data_types,
            )
        )

        # Register insurance pool in integration
        calls.append(
            Call(
                to_addr=integration_address,
                selector="register_insurance_pool",
                calldata=[pool_address],
            )
        )

        # Execute configuration
        config_tx = await account.execute(calls=calls)
        await config_tx.wait_for_acceptance()

        print("✅ System configured successfully")

    async def setup_initial_state(
        self, account: Account, token_address: int, pool_address: int
    ):
        """Set up initial system state with liquidity and test data."""
        print("🔧 Setting up initial state...")

        calls = []

        # Mint initial tokens for testing
        initial_mint = 1_000_000_000_000  # 1M tokens
        calls.append(
            Call(
                to_addr=token_address,
                selector="mint",
                calldata=[account.address, initial_mint, 0],  # amount as u256
            )
        )

        # Approve tokens for liquidity provision
        liquidity_amount = 500_000_000_000  # 500k tokens
        calls.append(
            Call(
                to_addr=token_address,
                selector="approve",
                calldata=[pool_address, liquidity_amount, 0],  # amount as u256
            )
        )

        # Provide initial liquidity
        calls.append(
            Call(
                to_addr=pool_address,
                selector="provide_liquidity",
                calldata=[liquidity_amount, 0],  # amount as u256
            )
        )

        # Execute setup
        setup_tx = await account.execute(calls=calls)
        await setup_tx.wait_for_acceptance()

        print("✅ Initial setup completed")
        print(f"   Initial liquidity: {liquidity_amount:,}")

    def save_deployment_info(self, addresses: Dict[str, int], account_address: int):
        """Save deployment information to file."""
        deployment_info = {
            "network": self.network,
            "timestamp": datetime.now().isoformat(),
            "deployer": hex(account_address),
            "contracts": {
                "token": hex(addresses["token"]),
                "oracle": hex(addresses["oracle"]),
                "integration": hex(addresses["integration"]),
                "insurance_pool": hex(addresses["pool"]),
            },
            "explorer_urls": {
                "token": f"{self.config['explorer_url']}/contract/{hex(addresses['token'])}",
                "oracle": f"{self.config['explorer_url']}/contract/{hex(addresses['oracle'])}",
                "integration": f"{self.config['explorer_url']}/contract/{hex(addresses['integration'])}",
                "insurance_pool": f"{self.config['explorer_url']}/contract/{hex(addresses['pool'])}",
            },
            "configuration": {
                "base_premium_rate": "5%",
                "liquidity_reward_rate": "10% annual",
                "initial_liquidity": "500,000 tokens",
                "supported_insurance_types": [
                    "Crop Insurance",
                    "Flight Delay Insurance",
                    "Hurricane Insurance",
                    "Earthquake Insurance",
                    "Temperature Insurance",
                ],
            },
        }

        # Save to JSON file
        with open("deployment_info.json", "w") as f:
            json.dump(deployment_info, f, indent=2)

        print(f"📋 Deployment info saved to deployment_info.json")

    async def run_deployment(self) -> bool:
        """Execute the complete deployment process."""
        try:
            print("🚀 Starting Parametric Insurance Pool Deployment...")
            print("=" * 60)

            # Setup account
            account = await self.setup_account()

            # Load contract artifacts
            artifacts = self.load_contract_artifacts()

            # Deploy contracts in order
            print("\n📦 Deploying Contracts...")
            print("-" * 40)

            token_address = await self.deploy_mock_token(account, artifacts)
            oracle_address = await self.deploy_mock_oracle(account, artifacts)
            integration_address = await self.deploy_oracle_integration(
                account, artifacts
            )
            pool_address = await self.deploy_insurance_pool(
                account, artifacts, token_address
            )

            addresses = {
                "token": token_address,
                "oracle": oracle_address,
                "integration": integration_address,
                "pool": pool_address,
            }

            print("\n⚙️ System Configuration...")
            print("-" * 40)

            # Configure system
            await self.configure_system(
                account, pool_address, oracle_address, integration_address
            )

            # Setup initial state
            await self.setup_initial_state(account, token_address, pool_address)

            # Save deployment info
            self.save_deployment_info(addresses, account.address)

            print("\n🎉 Deployment Completed Successfully!")
            print("=" * 60)
            print(f"🌐 Network: {self.network}")
            print(f"👤 Deployer: {hex(account.address)}")
            print(f"🏦 Insurance Pool: {hex(pool_address)}")
            print(f"🔮 Oracle: {hex(oracle_address)}")
            print(f"💰 Token: {hex(token_address)}")
            print(f"🔗 Integration: {hex(integration_address)}")
            print("\n📚 Next Steps:")
            print("   1. Run tests: cd contracts && scarb test")
            print("   2. Start monitoring: python scripts/monitor.py")
            print("   3. Update frontend: Use addresses in deployment_info.json")
            print("   4. Create test policies using the deployed contracts")

            return True

        except Exception as e:
            print(f"❌ Deployment failed: {e}")
            import traceback

            traceback.print_exc()
            return False


async def main():
    """Main deployment function."""
    import argparse

    parser = argparse.ArgumentParser(description="Deploy Parametric Insurance Pool")
    parser.add_argument(
        "--network",
        choices=["sepolia", "mainnet"],
        default="sepolia",
        help="Network to deploy to (default: sepolia)",
    )

    args = parser.parse_args()

    # Check environment variables
    required_env_vars = ["STARKNET_PRIVATE_KEY", "STARKNET_ACCOUNT_ADDRESS"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables and try again.")
        sys.exit(1)

    # Initialize deployer
    deployer = InsurancePoolDeployer(network=args.network)

    # Run deployment
    success = await deployer.run_deployment()

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
