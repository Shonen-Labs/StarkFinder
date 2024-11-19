import os
import json
from typing import List, Dict, Any
import requests
from datetime import datetime, timezone


DATA_DIR = "./data"
HF_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-1B"
HF_HEADERS = {"Authorization": "Bearer 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"}


def load_chain_data(chain: str) -> Dict[str, Any]:
    """
    Load yield data for a specific chain from the saved JSON files.
    """
    filename = f"{chain.lower()}.json"
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"No data found for chain: {chain}")
    with open(filepath, "r") as file:
        return json.load(file)


def query_llm(prompt: str) -> str:
    """
    Query the Hugging Face LLM with a prompt.
    """
    response = requests.post(HF_API_URL, headers=HF_HEADERS, json={"inputs": prompt})
    if response.status_code == 200:
        return response.json().get("generated_text", "No response available.")
    else:
        raise Exception(f"Error querying LLM: {response.status_code}, {response.text}")


def analyze_risks(chain_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze the risks and returns for protocols in the chain data.
    """
    protocols = chain_data.get("protocols", [])
    if not isinstance(protocols, list):
        raise ValueError("Invalid data format: 'protocols' should be a list.")

    
    valid_risk_protocols = [p for p in protocols if isinstance(p.get("ilRisk"), (int, float))]
    valid_apy_protocols = [p for p in protocols if isinstance(p.get("apyBase"), (int, float))]

    
    risky_protocol = max(valid_risk_protocols, key=lambda p: p["ilRisk"], default=None)
    best_apy_protocol = max(valid_apy_protocols, key=lambda p: p["apyBase"], default=None)

    return {
        "highest_risk": risky_protocol or "No protocols with valid ilRisk data.",
        "highest_apy": best_apy_protocol or "No protocols with valid apyBase data.",
        "total_protocols": len(protocols),
    }


def generate_suggestion(query: str) -> str:
    """
    Generate investment suggestions based on user input.
    """
    
    query_lower = query.lower()
    possible_chains = [file.replace(".json", "") for file in os.listdir(DATA_DIR) if file.endswith(".json")]
    chain = next((chain for chain in possible_chains if chain in query_lower), None)

    if not chain:
        return "I couldn't identify the chain from your query. Please specify the chain name."

    try:
        
        chain_data = load_chain_data(chain)
        risk_analysis = analyze_risks(chain_data)

        response = f"""
Based on the latest data for {chain.capitalize()}:
- The protocol with the highest risk is: {risk_analysis['highest_risk']}
- The protocol offering the highest APY is: {risk_analysis['highest_apy']}
- Total number of protocols analyzed: {risk_analysis['total_protocols']}

Please consider your risk tolerance before investing. Let me know if you'd like more details!
"""
        return response.strip()

    except Exception as e:
        return f"An error occurred: {e}"
    
    
    
    
    
'''
Example usage
'''
if __name__ == "__main__":
    user_query = "Which protocols on solana have the highest APY?"
    suggestion = generate_suggestion(user_query)
    print(suggestion)
