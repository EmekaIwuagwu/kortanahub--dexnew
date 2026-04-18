from web3 import Web3
from eth_account import Account

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
USDCK_ADDR = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
master = Account.from_key(MASTER_KEY)

# MINT ABI
MINT_ABI = [
    {"constant": False, "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "mint", "outputs": [], "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"},
]

def inject_liquidity():
    print(f"[INJECTION] TARGET: {master.address}")
    usdc = w3.eth.contract(address=w3.to_checksum_address(USDCK_ADDR), abi=MINT_ABI)
    
    amount_to_mint = 1_000_000 * 10**18 # 1M USDC.k
    
    nonce = w3.eth.get_transaction_count(master.address)
    tx = usdc.functions.mint(master.address, amount_to_mint).build_transaction({
        'nonce': nonce,
        'gas': 150000,
        'gasPrice': w3.to_wei('3', 'gwei'),
        'chainId': 9002
    })
    
    signed = w3.eth.account.sign_transaction(tx, master.key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction if hasattr(signed, 'raw_transaction') else signed.rawTransaction)
    print(f"   [OK] Liquidity Injected (1,000,000 USDC.k) | TX: {tx_hash.hex()}")
    
    # Wait for confirmation
    print("   [WAIT] Confirming manifest...")
    w3.eth.wait_for_transaction_receipt(tx_hash)
    
    new_bal = usdc.functions.balanceOf(master.address).call()
    print(f"[SUCCESS] NEW BALANCE: {new_bal / 1e18} USDC.k")

if __name__ == "__main__":
    inject_liquidity()
