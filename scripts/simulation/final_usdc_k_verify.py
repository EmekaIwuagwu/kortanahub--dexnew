import time
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

# [INSTITUTIONAL REGISTRY - OFFICIAL]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
CHAIN_ID = 9002

# [STRICT MAPPING]
USDC_K_ADDRESS = "0x28420E30857AE2340CA3127bB2539e3d0D767194"
WDNR_ADDRESS = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
# THE CHOSEN VESSEL - Stabilizer route confirmed for USDC.k compatibility
STABILIZER_ROUTER = "0xC4b211230FE1a8E25BAa122c9f250a725c0151C7"

# [SOVEREIGN ABIS]
ERC20_ABI = [
    {"constant": False, "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"},
]

STABILIZER_ABI = [
    {"inputs": [{"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {"internalType": "address[]", "name": "path", "type": "address[]"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}], "name": "swapExactDNRForTokens", "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}], "stateMutability": "payable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {"internalType": "address[]", "name": "path", "type": "address[]"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}], "name": "swapExactTokensForDNR", "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}], "stateMutability": "nonpayable", "type": "function"},
]

class KortanaSovereignSimulator:
    def __init__(self, master_key: str):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.master: LocalAccount = Account.from_key(master_key)
        self.router = self.w3.eth.contract(address=self.w3.to_checksum_address(STABILIZER_ROUTER), abi=STABILIZER_ABI)
        self.usdc = self.w3.eth.contract(address=self.w3.to_checksum_address(USDC_K_ADDRESS), abi=ERC20_ABI)
        
        self.gas_price = 1 
        self.gas_limit = 8000000 
        
        print(f"[SYSTEM] SOVEREIGN SIMULATOR INITIALIZED | MASTER: {self.master.address}")

    def wait_for_success(self, tx_hash, scenario_name):
        print(f"   [TX] Sending {scenario_name}: {tx_hash.hex()}...")
        try:
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            if receipt.status == 1:
                print(f"   [SUCCESS] {scenario_name} CONFIRMED in Block {receipt.blockNumber}")
            else:
                print(f"   [FAILED] {scenario_name} REVERTED.")
            return receipt
        except Exception as e:
            print(f"   [TIMEOUT/ERROR]: {str(e)}")
            return None

    def buy_usdc_k(self, dnr_amount):
        print(f"\n[SCENARIO] BUY USDC.k with {dnr_amount} DNR")
        val = self.w3.to_wei(dnr_amount, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.router.functions.swapExactDNRForTokens(
            0, [WDNR_ADDRESS, USDC_K_ADDRESS], self.master.address, int(time.time()) + 600
        ).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'value': val,
            'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        return self.wait_for_success(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction), "DNR -> USDC.k")

    def sell_usdc_k(self, usdc_amount):
        print(f"\n[SCENARIO] SELL USDC.k (Buy DNR) with {usdc_amount} USDC.k")
        val = self.w3.to_wei(usdc_amount, 'ether')
        
        # Approval
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        app_tx = self.usdc.functions.approve(STABILIZER_ROUTER, val).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'gas': 300000, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        self.wait_for_success(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(app_tx, self.master.key).raw_transaction), "USDC.k Approval")
        
        # Swap
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.router.functions.swapExactTokensForDNR(
            val, 0, [USDC_K_ADDRESS, WDNR_ADDRESS], self.master.address, int(time.time()) + 600
        ).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        return self.wait_for_success(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction), "USDC.k -> DNR")

if __name__ == "__main__":
    MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
    sim = KortanaSovereignSimulator(MASTER_KEY)
    
    # 1. Buy USDC.k with DNR
    sim.buy_usdc_k(0.01)
    
    # 2. Sell USDC.k for DNR
    sim.sell_usdc_k(1.5)
