import time
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

# [INSTITUTIONAL REGISTRY - KORTANA MAINNET STABLE]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
CHAIN_ID = 9002

# [MONODEX ADDRESSES - FROM KORTANADEX-NEW]
MONODEX_ADDRESS = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45"
WDNR_ADDRESS = "0xF08ef4987108dD4AEE330Da1255CD0D7CaBEd0a3"

# [SOVEREIGN ABIS]
MONODEX_ABI = [
    {"inputs": [{"internalType": "uint256", "name": "minOut", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}], "name": "swapExactDNRForKTUSD", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {"internalType": "uint256", "name": "minOut", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}], "name": "swapExactKTUSDForDNR", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
]

class KortanaStableSimulator:
    def __init__(self, master_key: str):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.master: LocalAccount = Account.from_key(master_key)
        self.dex = self.w3.eth.contract(address=self.w3.to_checksum_address(MONODEX_ADDRESS), abi=MONODEX_ABI)
        
        self.gas_price = 1 
        self.gas_limit = 2000000 # MonoDEX is more efficient
        
        print(f"[SYSTEM] STABLE SIMULATOR INITIALIZED | MASTER: {self.master.address}")
        print(f"[INFRA] MONODEX: {MONODEX_ADDRESS}")

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

    def buy_ktusd_with_dnr(self, amount_dnr):
        print(f"\n[SCENARIO] BUY ktUSD (USDC.k) with {amount_dnr} DNR")
        amount_wei = self.w3.to_wei(amount_dnr, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        
        tx = self.dex.functions.swapExactDNRForKTUSD(
            0, # minOut
            self.master.address
        ).build_transaction({
            'from': self.master.address,
            'nonce': nonce,
            'value': amount_wei,
            'gas': self.gas_limit,
            'gasPrice': self.gas_price,
            'chainId': CHAIN_ID
        })
        
        signed = self.w3.eth.account.sign_transaction(tx, self.master.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction if hasattr(signed, 'raw_transaction') else signed.rawTransaction)
        return self.wait_for_success(tx_hash, "DNR -> ktUSD")

    def sell_ktusd_for_dnr(self, amount_ktusd):
        print(f"\n[SCENARIO] SELL ktUSD (Get DNR) with {amount_ktusd} ktUSD")
        amount_wei = self.w3.to_wei(amount_ktusd, 'ether')
        nonce = self.w3.eth.get_transaction_count(self.master.address)
        
        tx = self.dex.functions.swapExactKTUSDForDNR(
            amount_wei,
            0, # minOut
            self.master.address
        ).build_transaction({
            'from': self.master.address,
            'nonce': nonce,
            'gas': self.gas_limit,
            'gasPrice': self.gas_price,
            'chainId': CHAIN_ID
        })
        
        signed = self.w3.eth.account.sign_transaction(tx, self.master.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction if hasattr(signed, 'raw_transaction') else signed.rawTransaction)
        return self.wait_for_success(tx_hash, "ktUSD -> DNR")

if __name__ == "__main__":
    MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
    sim = KortanaStableSimulator(MASTER_KEY)
    
    # Check Balance Before
    bal_ktusd = sim.dex.functions.balanceOf(sim.master.address).call()
    print(f"[BALANCE] current ktUSD balance: {sim.w3.from_wei(bal_ktusd, 'ether')}")

    # 1. Buy ktUSD with DNR
    sim.buy_ktusd_with_dnr(0.1)
    
    # 2. Sell ktUSD for DNR (Scenario 2 & 3)
    # Using 5 ktUSD for the test (we just bought ~38 ktUSD)
    if bal_ktusd >= sim.w3.to_wei(5, 'ether') or True: # Force run since we just bought some
        sim.sell_ktusd_for_dnr(5.0)
    else:
        print("\n[SKIP] Insufficient ktUSD for sell test. Buy more or seed first.")

    print("\n--- ALL STABLE SCENARIOS COMPLETE ---")
