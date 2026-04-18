from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
ROUTER_ADDRESS = "0xF31bB887853F7092706D7E2Cd9c9A7842f03Ca33"

ROUTER_ABI = [
    {"constant": True, "inputs": [], "name": "factory", "outputs": [{"name": "", "type": "address"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "WETH", "outputs": [{"name": "", "type": "address"}], "type": "function"},
]

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def audit_router():
    print(f"[AUDIT] TARGET ROUTER: {ROUTER_ADDRESS}")
    router = w3.eth.contract(address=w3.to_checksum_address(ROUTER_ADDRESS), abi=ROUTER_ABI)
    
    try:
        factory_addr = router.functions.factory().call()
        weth_addr = router.functions.WETH().call()
        
        print(f"[DATA] Router Factory: {factory_addr}")
        print(f"[DATA] Router WETH:    {weth_addr}")
        
    except Exception as e:
        print(f"[ERROR] Router audit failed: {e}")

if __name__ == "__main__":
    audit_router()
