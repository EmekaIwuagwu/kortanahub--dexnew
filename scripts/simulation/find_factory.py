from web3 import Web3

# [INSTITUTIONAL REGISTRY]
RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz"
WDNR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5"
USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194"

# WE WILL SCAN KNOWN FACTORIES
FACTORIES = [
    "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191",
    "0xAD188dff67EAD5F21B0D6CE0E7711D8Db8C76CFd" # TOKEN FACTORY (unlikely but checking)
]

FACTORY_ABI = [
    {"constant": True, "inputs": [{"name": "tokenA", "type": "address"}, {"name": "tokenB", "type": "address"}], "name": "getPair", "outputs": [{"name": "pair", "type": "address"}], "type": "function"},
]

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def find_true_factory():
    print(f"[SEARCH] Scanning for Factory containing {WDNR} / {USDCK}")
    for f_addr in FACTORIES:
        factory = w3.eth.contract(address=w3.to_checksum_address(f_addr), abi=FACTORY_ABI)
        try:
            pair = factory.functions.getPair(WDNR, USDCK).call()
            print(f"   [FOUND] Factory: {f_addr} | Pair: {pair}")
            if pair != "0x0000000000000000000000000000000000000000":
                print(f"🎯 TARGET FACTORY IDENTIFIED: {f_addr}")
                # Update contracts.ts locally if found
        except Exception as e:
            print(f"   [SKIP] Factory {f_addr} failed: {e}")

if __name__ == "__main__":
    find_true_factory()
