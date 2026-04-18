from web3 import Web3

RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

FACTORY_ADDR = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191"
PAIR_ADDR = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242"
WDNR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

PAIR_ABI = [
    {"inputs": [], "name": "factory", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "token0", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "token1", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "getReserves", "outputs": [{"internalType": "uint112", "name": "_reserve0", "type": "uint112"}, {"internalType": "uint112", "name": "_reserve1", "type": "uint112"}, {"internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32"}], "stateMutability": "view", "type": "function"},
]

FACTORY_ABI = [
    {"inputs": [{"internalType": "address", "name": "tokenA", "type": "address"}, {"internalType": "address", "name": "tokenB", "type": "address"}], "name": "getPair", "outputs": [{"internalType": "address", "name": "pair", "type": "address"}], "stateMutability": "view", "type": "function"},
]

def audit():
    print(f"--- DEEP AUDIT: PAIR & FACTORY ---")
    
    # 1. Check Factory getPair
    factory = w3.eth.contract(address=w3.to_checksum_address(FACTORY_ADDR), abi=FACTORY_ABI)
    try:
        pair_from_factory = factory.functions.getPair(w3.to_checksum_address(WDNR), w3.to_checksum_address(USDCK)).call()
        print(f"Factory getPair(WDNR, USDCK): {pair_from_factory}")
    except Exception as e:
        print(f"FAILED TO CALL FACTORY: {e}")
        return
    
    # 2. Check Pair Properties
    pair = w3.eth.contract(address=w3.to_checksum_address(PAIR_ADDR), abi=PAIR_ABI)
    try:
        p_factory = pair.functions.factory().call()
        print(f"Pair Factory: {p_factory}")
        p_t0 = pair.functions.token0().call()
        print(f"Pair Token0:  {p_t0}")
        p_t1 = pair.functions.token1().call()
        print(f"Pair Token1:  {p_t1}")
        reserves = pair.functions.getReserves().call()
        print(f"Reserves:     {reserves}")
        
        if p_factory.lower() != FACTORY_ADDR.lower():
            print(f"WARNING: PAIR FACTORY MISMATCH! Pair thinks its factory is {p_factory}")
            
    except Exception as e:
        print(f"FAILED TO AUDIT PAIR: {e}")

if __name__ == "__main__":
    audit()
