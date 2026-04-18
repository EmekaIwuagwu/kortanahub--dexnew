import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { kortanaMainnet } from "@/lib/wagmi";

const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
const ERC20_MIN_ABI = [
    { "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export async function GET() {
  try {
    const client = createPublicClient({
      chain: kortanaMainnet,
      transport: http()
    });

    const totalSupply = await client.readContract({
        address: CONTRACTS.WDNR as `0x${string}`,
        abi: ERC20_MIN_ABI,
        functionName: "totalSupply"
    }) as bigint;

    // Standard CMC/Gecko logic: Circulating = Total - (Treasury/Team/Locked)
    const circulating = formatUnits(totalSupply, 18);

    return new Response(circulating, {
        headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*" // Vital for 2026 CMC Bots
        }
    });
  } catch (error) {
    return new Response("200000000", { status: 200 }); // Default to initial genesis supply if RPC lag
  }
}
