import json
import random
from datetime import datetime, timedelta

class PoolDataGenerator:
    def __init__(self):
        self.chains = ["Ethereum", "Polygon", "Arbitrum", "Optimism", "Base", "Starknet"]
        self.protocols = ["Uniswap", "Curve", "Balancer", "Aave", "dYdX", "ZkSync"]
        self.assets = ["ETH", "USDC", "USDT", "BTC", "DAI", "WBTC", "MATIC", "ARB", "OP"]
        self.risk_levels = ["low", "medium", "high"]

    def generate_pool_name(self, assets):
        return f"{'-'.join(assets)} Pool"

    def generate_apy(self, risk_level):
        if risk_level == "low":
            return round(random.uniform(1, 10), 2)
        elif risk_level == "medium":
            return round(random.uniform(8, 25), 2)
        else:
            return round(random.uniform(20, 100), 2)

    def generate_tvl(self, risk_level):
        if risk_level == "low":
            return round(random.uniform(1000000, 10000000), 2)
        elif risk_level == "medium":
            return round(random.uniform(500000, 2000000), 2)
        else:
            return round(random.uniform(100000, 1000000), 2)

    def generate_impermanent_loss(self, risk_level):
        if risk_level == "low":
            return round(random.uniform(0, 5), 2)
        elif risk_level == "medium":
            return round(random.uniform(3, 15), 2)
        else:
            return round(random.uniform(10, 30), 2)

    def generate_pool(self):
        risk_level = random.choice(self.risk_levels)
        assets = random.sample(self.assets, k=random.randint(2, 3))
        
        return {
            "name": self.generate_pool_name(assets),
            "apy": self.generate_apy(risk_level),
            "tvl": self.generate_tvl(risk_level),
            "chain": random.choice(self.chains),
            "assets": assets,
            "riskLevel": risk_level,
            "impermanentLoss": self.generate_impermanent_loss(risk_level),
            "protocol": random.choice(self.protocols)
        }

    def generate_pools(self, num_pools=50):
        pools = []
        for _ in range(num_pools):
            pools.append(self.generate_pool())
        return pools

def main():
    # Create data directory if it doesn't exist
    import os
    if not os.path.exists('data'):
        os.makedirs('data')

    # Generate pool data
    generator = PoolDataGenerator()
    pools = generator.generate_pools()

    # Save to JSON file
    with open('data/tokens.json', 'w') as f:
        json.dump(pools, f, indent=2)

    print(f"Generated {len(pools)} pools and saved to data/tokens.json")

    # Print sample pool for verification
    print("\nSample pool data:")
    print(json.dumps(pools[0], indent=2))

if __name__ == "__main__":
    main()