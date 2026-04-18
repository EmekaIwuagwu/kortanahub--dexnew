"use client";

import { useReadContracts } from "wagmi";
import { ERC20_ABI } from "@/lib/abis";
import { formatUnits } from "viem";

export function useTokenMetadata(address: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address,
        abi: ERC20_ABI,
        functionName: "name",
      },
      {
        address,
        abi: ERC20_ABI,
        functionName: "symbol",
      },
      {
        address,
        abi: ERC20_ABI,
        functionName: "decimals",
      },
    ],
  });

  if (!address || isLoading || !data) {
    return { name: null, symbol: null, decimals: 18, isLoading };
  }

  return {
    name: data[0]?.result as string,
    symbol: data[1]?.result as string,
    decimals: (data[2]?.result as number) || 18,
    isLoading,
  };
}
