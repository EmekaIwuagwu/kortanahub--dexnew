import time
import os
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
CHAIN_ID = 9002

# [WHITELISTED ASSETS]
# Official MonoDEX handles internal wrapping and high-speed swaps for USDC.k (ktUSD)
MONODEX_ADDRESS = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45"

# [SOVEREIGN ABIS]
MONODEX_ABI = [
    {"inputs": [{"internalType": "uint256", "name": "minOut18", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}], "name": "swapExactDNRForKTUSD", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amountIn18", "type": "uint256"}, {"internalType": "uint256", "name": "minOut18", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}], "name": "swapExactKTUSDForDNR", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
]

class KortanaProductionSimulator:
    def __init__(self, master_key: str):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.master: LocalAccount = Account.from_key(master_key)
        self.dex = self.w3.eth.contract(address=self.w3.to_checksum_address(MONODEX_ADDRESS), abi=MONODEX_ABI)
        
        self.gas_price = 1  # Standard 1 Wei for Zeus
        self.gas_limit = 5000000
        
        self.log_file = "scripts/simulation/production_trades.log"
        with open(self.log_file, "w") as f:
            f.write(f"--- KORTANA PRODUCTION VERIFICATION LOG ---\n")
            f.write(f"Timestamp: {time.ctime()}\n")
            f.write(f"Master Wallet: {self.master.address}\n\n")

    def log(self, msg):
        print(msg)
        with open(self.log_file, "a") as f:
            f.write(msg + "\n")

    def verify_tx(self, tx_hash, scenario):
        self.log(f"   [TX] {scenario}: {tx_hash.hex()}")
        try:
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            if receipt.status == 1:
                self.log(f"   [SUCCESS] Status: 1 (Confirmed in Block {receipt.blockNumber})")
            else:
                self.log(f"   [FAILED] Status: 0 (Reverted)")
            return receipt
        except Exception as e:
            self.log(f"   [ERROR]: {str(e)}")
            return None

    def buy_usdc_k(self, dnr_amount):
        self.log(f"\n[SCENARIO] BUY USDC.k with {dnr_amount} DNR")
        val = self.w3.to_wei(dnr_amount, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.dex.functions.swapExactDNRForKTUSD(0, self.master.address).build_transaction({
            'from': self.master.address, 'nonce': nonce, 'value': val,
            'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        signed = self.w3.eth.account.sign_transaction(tx, self.master.key)
        return self.verify_tx(self.w3.eth.send_raw_transaction(signed.raw_transaction), "DNR -> USDC.k")

    def buy_dnr(self, usdc_amount):
        self.log(f"\n[SCENARIO] GROW DNR PRICE: Buy DNR with {usdc_amount} USDC.k")
        val = self.w3.to_wei(usdc_amount, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        tx = self.dex.functions.swapExactKTUSDForDNR(val, 0, self.master.address).build_transaction({
            'from': self.master.address, 'nonce': nonce,
            'gas': self.gas_limit, 'gasPrice': self.gas_price, 'chainId': CHAIN_ID
        })
        signed = self.w3.eth.account.sign_transaction(tx, self.master.key)
        return self.verify_tx(self.w3.eth.send_raw_transaction(signed.raw_transaction), "USDC.k -> DNR")

if __name__ == "__main__":
    MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
    sim = KortanaProductionSimulator(MASTER_KEY)
    
    # 🧪 Scenario 1: Buy USDC.k from DNR
    sim.buy_usdc_k(0.01)
    
    # 🧪 Scenario 2: Sell USDC.k to Grow DNR Price
    sim.buy_dnr(1.5)
    
    # 🧪 Scenario 3: Cycle Finalization
    sim.buy_usdc_k(0.02)
    
    print(f"\n[SYSTEM] ALL TRADES COMPLETE. LOG SAVED TO: {sim.log_file}")
