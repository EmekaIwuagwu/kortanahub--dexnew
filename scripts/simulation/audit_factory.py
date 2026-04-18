from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
FACTORY = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191"
WDNR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

FACTORY_ABI = [
    {"constant": True, "inputs": [{"name": "tokenA", "type": "address"}, {"name": "tokenB", "type": "address"}], "name": "getPair", "outputs": [{"name": "pair", "type": "address"}], "type": "function"},
]

PAIR_ABI = [
    {"constant": True, "inputs": [], "name": "getReserves", "outputs": [{"name": "_reserve0", "type": "uint112"}, {"name": "_reserve1", "type": "uint112"}, {"name": "_blockTimestampLast", "type": "uint32"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "token0", "outputs": [{"name": "", "type": "address"}], "type": "function"},
]

def audit_factory_registry():
    print(f"[AUDIT] FACTORY: {FACTORY}")
    factory = w3.eth.contract(address=w3.to_checksum_address(FACTORY), abi=FACTORY_ABI)
    
    pair_addr = factory.functions.getPair(WDNR, USDCK).call()
    print(f"[DATA] Factory getPair: {pair_addr}")
    
    if pair_addr == "0x0000000000000000000000000000000000000000":
        print("❌ CRITICAL: NO PAIR REGISTERED IN THIS FACTORY.")
        return

    pair = w3.eth.contract(address=w3.to_checksum_address(pair_addr), abi=PAIR_ABI)
    res = pair.functions.getReserves().call()
    t0 = pair.functions.token0().call()
    
    print(f"[DATA] Pair Token 0: {t0}")
    print(f"[DATA] Reserves:      {res}")

if __name__ == "__main__":
    audit_factory_registry()
