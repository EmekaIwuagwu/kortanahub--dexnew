import time
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

# [INSTITUTIONAL REGISTRY - OFFICIAL]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
CHAIN_ID = 9002

# [OFFICIAL MAPPINGS]
USDC_K_ADDRESS = "0x28420E30857AE2340CA3127bB2539e3d0D767194"
WDNR_ADDRESS = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
OFFICIAL_PAIR = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242"
ATOMIC_ROUTER = "0xAd2d54DFD50d694a489A01F761667f55F579C1cc"

ERC20_ABI = [
    {"constant": False, "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"},
]

ROUTER_ABI = [
    {"inputs": [{"internalType": "address", "name": "pair", "type": "address"}, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}], "name": "swapDNRForTokens", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "pair", "type": "address"}, {"internalType": "address", "name": "token", "type": "address"}, {"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}], "name": "swapTokensForDNR", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
]

class KortanaOfficialUSDCSimulator:
    def __init__(self, master_key: str):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.master: LocalAccount = Account.from_key(master_key)
        self.router = self.w3.eth.contract(address=self.w3.to_checksum_address(ATOMIC_ROUTER), abi=ROUTER_ABI)
        self.usdc = self.w3.eth.contract(address=self.w3.to_checksum_address(USDC_K_ADDRESS), abi=ERC20_ABI)
        
        self.gas_price = 1 
        self.gas_limit = 5000000 
        
        print(f"[SYSTEM] OFFICIAL USDC.k SIMULATOR INITIALIZED | MASTER: {self.master.address}")

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

    def buy_usdc_k(self, amount_dnr):
        print(f"\n[SCENARIO] BUY USDC.k with {amount_dnr} DNR")
        amount_wei = self.w3.to_wei(amount_dnr, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.router.functions.swapDNRForTokens(
            self.w3.to_checksum_address(OFFICIAL_PAIR), 0, self.master.address, int(time.time()) + 600
        ).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'value': amount_wei,
            'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        signed = self.w3.eth.account.sign_transaction(tx, self.master.key)
        return self.wait_for_success(self.w3.eth.send_raw_transaction(signed.raw_transaction), "DNR -> USDC.k")

    def sell_usdc_k(self, amount_usdc):
        print(f"\n[SCENARIO] SELL USDC.k for DNR (Amount: {amount_usdc} USDC.k)")
        val = self.w3.to_wei(amount_usdc, 'ether')
        
        # Approval
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        app_tx = self.usdc.functions.approve(ATOMIC_ROUTER, val).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'gas': 200000, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        self.wait_for_success(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(app_tx, self.master.key).raw_transaction), "Approval")
        
        # Swap
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.router.functions.swapTokensForDNR(
            self.w3.to_checksum_address(OFFICIAL_PAIR), self.w3.to_checksum_address(USDC_K_ADDRESS),
            val, 0, self.master.address, int(time.time()) + 600
        ).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        return self.wait_for_success(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction), "USDC.k -> DNR")

if __name__ == "__main__":
    MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
    sim = KortanaOfficialUSDCSimulator(MASTER_KEY)
    
    # Execute Official USDC.k Scenarios
    sim.buy_usdc_k(0.01)
    sim.sell_usdc_k(1.5)
    
    print("\n--- OFFICIAL USDC.k VERIFICATION COMPLETE ---")
