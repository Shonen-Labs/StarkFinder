import os
import json
import requests
from datetime import datetime

# Define the API URL and the data directory
YIELDS_API_URL = "https://yields.llama.fi/pools"
DATA_DIR = "./data"

def fetch_and_save_yields():
    """
    Fetches yield data from DeFi Llama API and saves it in JSON files grouped by chain.
    """
    try:
        print("Fetching yields data...")
        response = requests.get(YIELDS_API_URL)
        response.raise_for_status() 
        data = response.json()["data"]

        
        chain_data = {}
        for protocol in data:
            chain = protocol["chain"].lower()
            if chain not in chain_data:
                chain_data[chain] = []
            chain_data[chain].append(protocol)


        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
        for chain, protocols in chain_data.items():
            filename = f"{chain}.json"
            filepath = os.path.join(DATA_DIR, filename)
            with open(filepath, "w") as file:
                json.dump({
                    "timestamp": datetime.utcnow().isoformat(),
                    "chain": chain,
                    "protocols": protocols,
                    "count": len(protocols)
                }, file, indent=4)
            print(f"{chain} data saved to {filename}")

    except requests.RequestException as e:
        print(f"Error fetching yields data: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    fetch_and_save_yields()
