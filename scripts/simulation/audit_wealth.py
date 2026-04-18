from web3 import Web3
from eth_account import Account

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
master = Account.from_key(MASTER_KEY)

def audit_wealth():
    print(f"[AUDIT] MASTER ADDRESS: {master.address}")
    
    dnr_balance = w3.eth.get_balance(master.address)
    nonce = w3.eth.get_transaction_count(master.address)
    
    print(f"[DATA] DNR Balance: {dnr_balance / 1e18} DNR")
    print(f"[DATA] Nonce:       {nonce}")
    
    # Check USDC.k
    ERC20_ABI = [{"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}]
    usdc = w3.eth.contract(address=w3.to_checksum_address(USDCK), abi=ERC20_ABI)
    usdc_balance = usdc.functions.balanceOf(master.address).call()
    
    print(f"[DATA] USDC.k Balance: {usdc_balance / 1e18} USDC.k")

if __name__ == "__main__":
    audit_wealth()
