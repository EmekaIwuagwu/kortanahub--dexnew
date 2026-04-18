from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
ROUTER_ADDR = "0x89FaB1ec44d928D9bb7fe595eB7315ae375eb17E"

ROUTER_ABI = [
    {"constant": True, "inputs": [], "name": "factory", "outputs": [{"name": "", "type": "address"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "WDNR", "outputs": [{"name": "", "type": "address"}], "type": "function"},
]

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def audit_final_router():
    print(f"[AUDIT] ROUTER ADDRESS: {ROUTER_ADDR}")
    router = w3.eth.contract(address=w3.to_checksum_address(ROUTER_ADDR), abi=ROUTER_ABI)
    
    try:
        f = router.functions.factory().call()
        w = router.functions.WDNR().call()
        print(f"[DATA] Router Linked Factory: {f}")
        print(f"[DATA] Router Linked WDNR:    {w}")
    except Exception as e:
        print(f"[FAIL] Audit failed: {e}")

if __name__ == "__main__":
    audit_final_router()
