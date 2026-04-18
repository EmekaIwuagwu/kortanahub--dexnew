"use client";

import { useBalance, useReadContract, useAccount } from "wagmi";
import { ERC20_ABI } from "@/lib/abis";
import { formatUnits } from "viem";

interface Token {
  address: string;
  decimals: number;
  symbol: string;
  isNative?: boolean;
}

export function useTokenBalance(token: Token | undefined) {
  const { address } = useAccount();

  // Native Balance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address: address,
    chainId: 9002,
    query: {
      enabled: !!address && !!token?.isNative,
      refetchInterval: 8_000,
    }
  });

  // ERC20 Balance
  const { data: erc20Balance, isLoading: isLoadingErc20 } = useReadContract({
    address: token?.isNative ? undefined : (token?.address as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 9002,
    query: {
      enabled: !!address && !!token && !token.isNative,
      refetchInterval: 8_000,
    }
  });

  if (!token || !address) return { formatted: "0.0", value: 0n, isLoading: false };

  if (token.isNative) {
    // Format native balance from the value and decimals
    const formattedNative = nativeBalance
      ? formatUnits(nativeBalance.value, nativeBalance.decimals)
      : "0.0";
    return {
      formatted: formattedNative,
      value: nativeBalance?.value || 0n,
      isLoading: isLoadingNative,
    };
  }

  return {
    formatted: erc20Balance ? formatUnits(erc20Balance as bigint, token.decimals) : "0.0",
    value: (erc20Balance as bigint) || 0n,
    isLoading: isLoadingErc20,
  };
}
