from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
PAIR_ADDR = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def interrogate_pair():
    print(f"[INTERROGATION] PAIR ADDRESS: {PAIR_ADDR}")
    code = w3.eth.get_code(w3.to_checksum_address(PAIR_ADDR))
    print(f"[DATA] Bytecode length: {len(code)}")
    
    if len(code) == 0:
        print("[FAIL] NO CODE AT PAIR ADDRESS.")
        return

    # Check reserves directly
    PAIR_ABI = [
        {"constant": True, "inputs": [], "name": "getReserves", "outputs": [{"name": "_reserve0", "type": "uint112"}, {"name": "_reserve1", "type": "uint112"}, {"name": "_blockTimestampLast", "type": "uint32"}], "type": "function"},
    ]
    pair = w3.eth.contract(address=w3.to_checksum_address(PAIR_ADDR), abi=PAIR_ABI)
    try:
        res = pair.functions.getReserves().call()
        print(f"[SUCCESS] Reserves: {res}")
    except Exception as e:
        print(f"[FAIL] getReserves failed: {e}")

if __name__ == "__main__":
    interrogate_pair()
