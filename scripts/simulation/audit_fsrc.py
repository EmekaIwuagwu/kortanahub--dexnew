from web3 import Web3

RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

FACTORY_ADDR = "0x144d2659363c643D1bCf5F4958c2aBB2a51a258C"
PAIR_ADDR = "0xC116bb3D2923cdb152049cFF69FD68240aF572bA"
WDNR = "0xABa74d3376984817d8739E3Ec2B99d3b6Ed8E481"
USDCK = "0x661BE53c9f5B77C075c0F9E0680260285846F9CA"
ROUTER = "0x4bD4cc857bBa632dc6fd4F9818197CBfC67EFC19"

ABI = [
    {"inputs": [], "name": "factory", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "WDNR", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {"internalType": "address[]", "name": "path", "type": "address[]"}], "name": "getAmountsOut", "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}], "stateMutability": "view", "type": "function"}
]

def audit():
    print(f"--- F-SRC AUDIT: ALIGNMENT CHECK ---")
    router = w3.eth.contract(address=w3.to_checksum_address(ROUTER), abi=ABI)
    try:
        f = router.functions.factory().call()
        w = router.functions.WDNR().call()
        print(f"Router Factory: {f}")
        print(f"Router WDNR:    {w}")
        
        path = [w3.to_checksum_address(WDNR), w3.to_checksum_address(USDCK)]
        amounts = router.functions.getAmountsOut(10**18, path).call()
        print(f"SUCCESS! 1 DNR = {amounts[1] / 1e18} USDC.k")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    audit()
