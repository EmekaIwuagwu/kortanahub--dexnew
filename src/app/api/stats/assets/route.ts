import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { kortanaMainnet } from "@/lib/wagmi";

const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
const EXPLORER_URL = "https://zeus-explorer.mainnet.kortana.xyz";

const ERC20_MIN_ABI = [
    { "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export async function GET() {
  try {
    const client = createPublicClient({
      chain: kortanaMainnet,
      transport: http()
    });

    const dnrTotalSupply = await client.readContract({
        address: CONTRACTS.WDNR as `0x${string}`,
        abi: ERC20_MIN_ABI,
        functionName: "totalSupply"
    }) as bigint;

    const usdckTotalSupply = await client.readContract({
        address: CONTRACTS.KORTUSD as `0x${string}`,
        abi: ERC20_MIN_ABI,
        functionName: "totalSupply"
    }) as bigint;

    return NextResponse.json({
        "DNR": {
            name: "Dinar",
            symbol: "DNR",
            id: CONTRACTS.WDNR,
            unified_cryptoasset_id: "DNR",
            circulating_supply: formatUnits(dnrTotalSupply, 18),
            total_supply: formatUnits(dnrTotalSupply, 18),
            website: "https://kortana.xyz",
            explorer: EXPLORER_URL,
            logo: "https://dex.kortana.xyz/logo.png"
        },
        "USDC.k": {
            name: "Kortana USDC",
            symbol: "USDC.k",
            id: CONTRACTS.KORTUSD,
            reserves_address: "0xC70292a9DC97cF548Fee9839D7696CBAFc951B20", // Master Treasury
            circulating_supply: formatUnits(usdckTotalSupply, 18),
            total_supply: formatUnits(usdckTotalSupply, 18),
            website: "https://kortana.xyz",
            explorer: EXPLORER_URL,
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqhd-VoqzIsAybhoAanc3duqd8lskcjuzi1Q&s"
        }
    });
  } catch (error) {
    return NextResponse.json({ error: "Compliant Asset Audit Failed" }, { status: 500 });
  }
}
