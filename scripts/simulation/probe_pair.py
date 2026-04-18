import time
from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
ROUTER_ADDRESS = "0xF31bB887853F7092706D7E2Cd9c9A7842f03Ca33"
PAIR_ADDRESS = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242"

PAIR_ABI = [
    {"constant": True, "inputs": [], "name": "getReserves", "outputs": [{"name": "_reserve0", "type": "uint112"}, {"name": "_reserve1", "type": "uint112"}, {"name": "_blockTimestampLast", "type": "uint32"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "token0", "outputs": [{"name": "", "type": "address"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "token1", "outputs": [{"name": "", "type": "address"}], "type": "function"},
]

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def probe_reserves():
    print(f"[PROBE] TARGET PAIR: {PAIR_ADDRESS}")
    pair = w3.eth.contract(address=w3.to_checksum_address(PAIR_ADDRESS), abi=PAIR_ABI)
    
    try:
        t0 = pair.functions.token0().call()
        t1 = pair.functions.token1().call()
        reserves = pair.functions.getReserves().call()
        
        print(f"[DATA] Token 0: {t0}")
        print(f"[DATA] Token 1: {t1}")
        print(f"[DATA] Reserve 0: {reserves[0] / 1e18}")
        print(f"[DATA] Reserve 1: {reserves[1] / 1e18}")
        
    except Exception as e:
        print(f"[ERROR] Pair probe failed: {e}")

if __name__ == "__main__":
    probe_reserves()
