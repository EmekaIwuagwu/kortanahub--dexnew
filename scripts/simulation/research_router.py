from web3 import Web3

RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

ROUTER_ADDR = "0x9690feD6B9c5b8DDeF10BcE7ADFC328F7D91f32A"
WDNR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "address[]", "name": "path", "type": "address[]"}
        ],
        "name": "getAmountsOut",
        "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def test_call():
    router = w3.eth.contract(address=w3.to_checksum_address(ROUTER_ADDR), abi=ABI)
    path = [w3.to_checksum_address(WDNR), w3.to_checksum_address(USDCK)]
    amount_in = Web3.to_wei(1, 'ether')
    
    print(f"Testing getAmountsOut on {ROUTER_ADDR}...")
    try:
        amounts = router.functions.getAmountsOut(amount_in, path).call()
        print(f"SUCCESS! 1 DNR = {amounts[1] / 1e18} USDC.k")
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    test_call()
