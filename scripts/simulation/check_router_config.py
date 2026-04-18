from web3 import Web3

RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

ROUTERS = [
    "0x6C5308d2d891E79092fF011AaCaa7eEE4a8555BA", # OLD
    "0x9690feD6B9c5b8DDeF10BcE7ADFC328F7D91f32A"  # NEW
]

ABI = [
    {"inputs": [], "name": "factory", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "WDNR", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}
]

for addr in ROUTERS:
    print(f"Checking Router: {addr}")
    c = w3.eth.contract(address=w3.to_checksum_address(addr), abi=ABI)
    try:
        f = c.functions.factory().call()
        w = c.functions.WDNR().call()
        print(f"  Factory: {f}")
        print(f"  WDNR:    {w}")
    except Exception as e:
        print(f"  Error: {e}")
