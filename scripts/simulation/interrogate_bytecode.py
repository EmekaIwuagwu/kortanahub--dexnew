from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
ROUTER_ADDR = "0xF31bB887853F7092706D7E2Cd9c9A7842f03Ca33"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def interrogate_bytecode():
    print(f"[INTERROGATION] ADDRESS: {ROUTER_ADDR}")
    code = w3.eth.get_code(w3.to_checksum_address(ROUTER_ADDR))
    print(f"[DATA] Bytecode length: {len(code)}")
    if len(code) == 0:
        print("CRITICAL: NO CODE AT THIS ADDRESS. CONTRACT NOT DEPLOYED ON THIS RPC.")
    else:
        print("CODE DETECTED. CONTRACT IS MANIFESTED.")
        # Check for selector: getAmountsOut(uint256,address[]) -> d0671d76
        selector = "d0671d76"
        if selector in code.hex():
            print(f"SELECTOR DETECTED: {selector} (getAmountsOut)")
        else:
            print(f"SELECTOR NOT FOUND: {selector}")

if __name__ == "__main__":
    interrogate_bytecode()
