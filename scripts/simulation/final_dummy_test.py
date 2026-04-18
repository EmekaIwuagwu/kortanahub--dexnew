import time
import os
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
CHAIN_ID = 9002

# [WHITELISTED PROTOCOLS]
MONODEX_ADDR = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45"
SELL_WRAPPER_ADDR = "0xB848d5d48C9E878B11d122dae61BE9718A48Ed5e"

# [ABIS]
MONODEX_ABI = [
    {"inputs": [{"internalType": "uint256", "name": "minOut18", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}], "name": "swapExactDNRForKTUSD", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"},
]
WRAPPER_ABI = [
    {"inputs": [{"internalType": "uint256", "name": "amount18", "type": "uint256"}], "name": "sell", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
]

class KortanaFinalDummyTest:
    def __init__(self, master_key: str):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.master: LocalAccount = Account.from_key(master_key)
        self.dex = self.w3.eth.contract(address=self.w3.to_checksum_address(MONODEX_ADDR), abi=MONODEX_ABI)
        self.wrapper = self.w3.eth.contract(address=self.w3.to_checksum_address(SELL_WRAPPER_ADDR), abi=WRAPPER_ABI)
        
        self.gas_price = 1
        self.gas_limit = 5000000
        
        self.log_file = "scripts/simulation/dummy_trade.log"
        with open(self.log_file, "w") as f:
            f.write(f"--- KORTANA FINAL DUMMY TRADE LOG ---\n")
            f.write(f"Timestamp: {time.ctime()}\n")
            f.write(f"Master Wallet: {self.master.address}\n\n")

    def log(self, msg):
        print(msg)
        with open(self.log_file, "a") as f:
            f.write(msg + "\n")

    def verify(self, tx_hash, scenario):
        self.log(f"   [TX] {scenario}: {tx_hash.hex()}")
        try:
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            if receipt.status == 1:
                self.log(f"   [SUCCESS] End Status: 1 (Confirmed)")
                return True
            else:
                self.log(f"   [FAILED] Status: 0 (Reverted)")
                return False
        except Exception as e:
            self.log(f"   [TIMEOUT/ERROR]: {str(e)}")
            return False

    def buy_dnr_pattern(self, amount_usdc, label):
        self.log(f"\n[SCENARIO] {label} (Using Sovereign Wrapper)")
        val = self.w3.to_wei(amount_usdc, 'ether')
        
        # 1. Supply Wrapper
        self.log("   [1] Supplying USDC.k to Wrapper...")
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx1 = self.dex.functions.transfer(SELL_WRAPPER_ADDR, val).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'gas': 200000, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        if self.verify(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx1, self.master.key).raw_transaction), "Supply Wrapper"):
            # 2. Trigger Sell
            time.sleep(5)
            self.log("   [2] Executing Sovereign Sell...")
            nonce = self.w3.eth.get_transaction_count(self.master.address)
            tx2 = self.wrapper.functions.sell(val).build_transaction({
                'from': self.master.address, 'nonce': nonce, 'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
            })
            return self.verify(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx2, self.master.key).raw_transaction), "Sovereign Sell")
        return False

    def buy_usdc_pattern(self, amount_dnr):
        self.log(f"\n[SCENARIO] Buy USDC.k with {amount_dnr} DNR (Using MonoDEX)")
        val = self.w3.to_wei(amount_dnr, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.dex.functions.swapExactDNRForKTUSD(0, self.master.address).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'value': val,
            'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        return self.verify(self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction), "DNR -> USDC.k")

if __name__ == "__main__":
    MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
    sim = KortanaFinalDummyTest(MASTER_KEY)
    
    # 🧪 Order 1: Buy DNR with USDC.k
    sim.buy_dnr_pattern(0.5, "Buy DNR with USDC.k")
    
    # 🧪 Order 2: Grow DNR Price
    sim.buy_dnr_pattern(1.5, "SELL USDC.K TO GROW DNR")
    
    # 🧪 Order 3: Buy USDC.k with DNR
    sim.buy_usdc_pattern(0.01)
    
    print(f"\n[SYSTEM] FINAL DUMMY TEST COMPLETE. LOG: {sim.log_file}")
