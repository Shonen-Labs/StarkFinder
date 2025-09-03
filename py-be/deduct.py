async def generate_contract(user_wallet, contract_data):
    fee_amount = calculate_fee(contract_data)

    try:
        tx_hash = await deduct_fee(user_wallet, fee_amount)
    except FeeDeductionError as e:
        return {"status": "failed", "reason": str(e)}

    contract_address = await deploy_contract(contract_data)
    return {
        "status": "success",
        "tx_hash": tx_hash,
        "contract_address": contract_address,
    }
