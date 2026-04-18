from web3 import Web3
from eth_abi import decode

RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

ROUTER_ADDR = "0x9690feD6B9c5b8DDeF10BcE7ADFC328F7D91f32A"
WDNR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

# getAmountsOut(uint256,address[]) -> d06ca61f
def test_revert():
    print(f"Testing Router: {ROUTER_ADDR}")
    
    amount_in = 10**18
    path = [w3.to_checksum_address(WDNR), w3.to_checksum_address(USDCK)]
    
    # Manually encode arguments
    # 0: amountIn (uint256)
    # 1: path offset (uint256)
    # 2: path length (uint256)
    # 3: path[0] (address)
    # 4: path[1] (address)
    
    data = "d06ca61f"
    data += amount_in.to_bytes(32, 'big').hex()
    data += (32 * 2).to_bytes(32, 'big').hex() # offset to array
    data += (2).to_bytes(32, 'big').hex() # array length
    data += bytes.fromhex(path[0][2:].zfill(64)).hex()
    data += bytes.fromhex(path[1][2:].zfill(64)).hex()
    
    print(f"Call Data: {data}")
    
    try:
        # eth_call
        res = w3.eth.call({'to': w3.to_checksum_address(ROUTER_ADDR), 'data': data})
        print(f"Result (Hex): {res.hex()}")
        if len(res) > 0:
            # Try decode error
            if res.hex().startswith('08c379a0'):
                error_msg = decode(['string'], res[4:])[0]
                print(f"Revert Reason: {error_msg}")
            else:
                print("Unknown return data.")
        else:
            print("EMPTY RETURN DATA (0x)")
            
    except Exception as e:
        print(f"Call Exception: {e}")

if __name__ == "__main__":
    test_revert()
