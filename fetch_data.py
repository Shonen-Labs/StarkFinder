import os
import json
import requests

YIELD_API_URL = "https://yields.llama.fi/pools"
TOKEN_API_URL = "https://starknet.api.avnu.fi/v1/starknet/tokens"

DATA_DIR = "./data"
YIELD_DIR = f"{DATA_DIR}/yields"

os.makedirs(YIELD_DIR, exist_ok=True)

def save_json(data, filepath):
    try:
        with open(filepath, "w") as file:
            json.dump(data, file, indent=4)
        print(f"✅ Saved: {filepath}")
    except IOError as e:
        print(f"❌ Error saving {filepath}: {e}")

def fetch_yield_data():

    try:
        response = requests.get(YIELD_API_URL, timeout=10)
        response.raise_for_status()
        yield_data = response.json().get("data", [])
        chain_data = {}
        for pool in yield_data:
            chain = pool.get("chain", "unknown").lower()
            if chain not in chain_data:
                chain_data[chain] = []
            chain_data[chain].append(pool)

        for chain, pools in chain_data.items():
            save_json(pools, f"{YIELD_DIR}/{chain}.json")

        print(f"✅ Fetched and saved yield data for {len(chain_data)} chains.")

    except (requests.exceptions.RequestException, IOError, json.JSONDecodeError) as e:
        print(f"❌ Error fetching yield data: {e}")

def fetch_token_data():
    try:
        response = requests.get(TOKEN_API_URL, timeout=10)
        response.raise_for_status()
        token_data = response.json().get("content", [])

        save_json(token_data, f"{DATA_DIR}/tokens.json")
        print(f"✅ Fetched and saved {len(token_data)} tokens successfully.")

    except (requests.exceptions.RequestException, IOError, json.JSONDecodeError) as e:
        print(f"❌ Error fetching token data: {e}")

fetch_yield_data()
fetch_token_data()
