import time
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
CHAIN_ID = 9002

# [STRICT USDC.K MAPPING]
USDC_K_ADDRESS = "0x28420E30857AE2340CA3127bB2539e3d0D767194"
WDNR_ADDRESS = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
# WE USE THE PAIR DIRECTLY - bypassing factory lookup failures
PAIR_ADDRESS = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d"

# [SOVEREIGN ABIS]
ERC20_ABI = [
    {"constant": False, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"},
]
WDNR_ABI = [{"inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function"}] + ERC20_ABI
PAIR_ABI = [
    {"inputs": [], "name": "getReserves", "outputs": [{"internalType": "uint112", "name": "reserve0", "type": "uint112"}, {"internalType": "uint112", "name": "reserve1", "type": "uint112"}, {"internalType": "uint32", "name": "blockTimestampLast", "type": "uint32"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amount0Out", "type": "uint256"}, {"internalType": "uint256", "name": "amount1Out", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "bytes", "name": "data", "type": "bytes"}], "name": "swap", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
]

class KortanaUSDCInjection:
    def __init__(self, master_key: str):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self.master: LocalAccount = Account.from_key(master_key)
        self.pair = self.w3.eth.contract(address=self.w3.to_checksum_address(PAIR_ADDRESS), abi=PAIR_ABI)
        self.wdnr = self.w3.eth.contract(address=self.w3.to_checksum_address(WDNR_ADDRESS), abi=WDNR_ABI)
        self.usdc = self.w3.eth.contract(address=self.w3.to_checksum_address(USDC_K_ADDRESS), abi=ERC20_ABI)
        
        self.gas = {"gas": 5000000, "gasPrice": 1, "chainId": CHAIN_ID}
        print(f"[SYSTEM] SOVEREIGN INJECTOR INITIALIZED | MASTER: {self.master.address}")

    def execute_buy(self, amount_dnr):
        print(f"\n[INJECTION] BUY USDC.k with {amount_dnr} DNR")
        
        # 1. Wrap
        print("   [1] Wrapping DNR...")
        tx = self.wdnr.functions.deposit().build_transaction({
            'nonce': self.w3.eth.get_transaction_count(self.master.address),
            'value': self.w3.to_wei(amount_dnr, 'ether'), **self.gas
        })
        self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction)
        
        # 2. Transfer to Pair
        print("   [2] Injecting WDNR to Pair...")
        time.sleep(2)
        tx = self.wdnr.functions.transfer(PAIR_ADDRESS, self.w3.to_wei(amount_dnr, 'ether')).build_transaction({
            'nonce': self.w3.eth.get_transaction_count(self.master.address), **self.gas
        })
        self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction)
        
        # 3. Swap (Calculated 1 DNR -> ~215 USDC)
        print("   [3] Triggering Atomic Swap...")
        time.sleep(2)
        # Assuming WDNR is token0, USDC is token1
        # Buying USDC (token1)
        tx = self.pair.functions.swap(0, self.w3.to_wei(10, 'ether'), self.master.address, b"").build_transaction({
            'nonce': self.w3.eth.get_transaction_count(self.master.address), **self.gas
        })
        tx_hash = self.w3.eth.send_raw_transaction(self.w3.eth.account.sign_transaction(tx, self.master.key).raw_transaction)
        print(f"   [TX] Hash: {tx_hash.hex()}")
        return tx_hash

if __name__ == "__main__":
    MASTER_KEY = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70"
    sim = KortanaUSDCInjection(MASTER_KEY)
    sim.execute_buy(0.1)
