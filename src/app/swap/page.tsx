"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowDown,
  Settings2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Info,
  TrendingUp,
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, DEFAULT_TOKENS } from "@/lib/contracts";
import { ROUTER_ABI, ERC20_ABI, FACTORY_ABI, PAIR_ABI, ATOMIC_ROUTER_ABI } from "@/lib/abis";
import { parseUnits, formatUnits } from "viem";
import { TokenSelectorModal } from "@/components/TokenSelectorModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { TxStatusModal } from "@/components/TxStatusModal";

type Token = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isNative?: boolean;
  logo?: string;
};

export default function SwapPage() {
  const { isConnected, address } = useAccount();
  const [tokenIn, setTokenIn] = useState<Token>(DEFAULT_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(DEFAULT_TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"in" | "out">("in");
  const [slippage, setSlippage] = useState(0.5);

  const [activeStep, setActiveStep] = useState<"idle" | "approving" | "swapping" | "success">("idle");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { formatted: balanceInFormatted } = useTokenBalance(tokenIn);
  const { formatted: balanceOutFormatted } = useTokenBalance(tokenOut);

  const swapPath = useMemo(() => {
    const inAddr = (tokenIn.isNative ? CONTRACTS.WDNR : tokenIn.address) as `0x${string}`;
    const outAddr = (tokenOut.isNative ? CONTRACTS.WDNR : tokenOut.address) as `0x${string}`;
    return [inAddr, outAddr];
  }, [tokenIn, tokenOut]);

  const parsedAmountIn = useMemo(() => {
    try {
      if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) return 0n;
      return parseUnits(amountIn, tokenIn.decimals);
    } catch { return 0n; }
  }, [amountIn, tokenIn]);

  // ─── Direct Atomic Price Resolution ───
  const { data: factoryPair } = useReadContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: swapPath as [`0x${string}`, `0x${string}`],
    query: { enabled: !!swapPath[0] && !!swapPath[1] }
  });

  const pairAddress = useMemo(() => {
    const isWdnrUsdc = (swapPath[0].toLowerCase() === CONTRACTS.WDNR.toLowerCase() && swapPath[1].toLowerCase() === CONTRACTS.KORTUSD.toLowerCase()) || 
                       (swapPath[1].toLowerCase() === CONTRACTS.WDNR.toLowerCase() && swapPath[0].toLowerCase() === CONTRACTS.KORTUSD.toLowerCase());
    // LOCK TO WHITELISTED INSTITUTIONAL PAIR FOR PRICING (0x8578...)
    return isWdnrUsdc ? "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242" : (factoryPair as string);
  }, [swapPath, factoryPair]);


  const { data: reserves, isLoading: isReservesLoading, refetch: refetchReserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { enabled: !!pairAddress, refetchInterval: 10_000 }
  });

  const { data: token0 } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "token0",
    query: { enabled: !!pairAddress }
  });

  const isQuoting = isReservesLoading;

  useEffect(() => {
    if (reserves && token0 && parsedAmountIn > 0n) {
      const [r0, r1] = reserves as [bigint, bigint, number];
      const isToken0 = (swapPath[0].toLowerCase() === (token0 as string).toLowerCase());
      const [reserveIn, reserveOut] = isToken0 ? [r0, r1] : [r1, r0];

      if (reserveIn > 0n && reserveOut > 0n) {
        const amountInWithFee = parsedAmountIn * 997n;
        const numerator = amountInWithFee * reserveOut;
        const denominator = (reserveIn * 1000n) + amountInWithFee;
        const out = numerator / denominator;
        setAmountOut(formatUnits(out, tokenOut.decimals));
      } else {
        setAmountOut("");
      }
    } else {
      setAmountOut("");
    }
  }, [reserves, token0, parsedAmountIn, swapPath, tokenOut.decimals]);


  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.ATOMIC_ROUTER as `0x${string}`] : undefined,
    query: { enabled: !!address && !tokenIn.isNative },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const handleSwap = async () => {
    if (!parsedAmountIn || !address || !pairAddress) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const quoteAmt = amountOut ? parseUnits(amountOut, tokenOut.decimals) : 0n;
    const minOut = (quoteAmt * BigInt(Math.floor((100 - slippage) * 100))) / 10000n;

    if (!tokenIn.isNative && (allowance as bigint || 0n) < parsedAmountIn) {
      setActiveStep("approving");
      writeContract({
        address: tokenIn.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.ATOMIC_ROUTER as `0x${string}`, parsedAmountIn * 10000n],
      });
      return;
    }

    setActiveStep("swapping");
    if (tokenIn.isNative) {
      writeContract({
        address: CONTRACTS.ATOMIC_ROUTER as `0x${string}`,
        abi: ATOMIC_ROUTER_ABI,
        functionName: "swapDNRForTokens",
        args: [pairAddress, minOut, address, deadline],
        value: parsedAmountIn,
        type: "legacy",
      });
    } else {
      writeContract({
        address: CONTRACTS.ATOMIC_ROUTER as `0x${string}`,
        abi: ATOMIC_ROUTER_ABI,
        functionName: "swapTokensForDNR",
        args: [pairAddress, tokenIn.address, parsedAmountIn, minOut, address, deadline],
        type: "legacy",
      });
    }
  };


  useEffect(() => {
    if (isSuccess && receipt?.status === "success") {
      if (activeStep === "approving") refetchAllowance();
      else if (activeStep === "swapping") {
        setActiveStep("success");
        setAmountIn("");
        setAmountOut("");
      }
    }
  }, [isSuccess, receipt, activeStep, refetchAllowance]);

  useEffect(() => {
    if (isPending || isConfirming || isSuccess || error) setIsStatusModalOpen(true);
  }, [isPending, isConfirming, isSuccess, error]);

  const needsApproval = !tokenIn.isNative && (allowance as bigint || 0n) < parsedAmountIn;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0a0d14]">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in duration-700">
        <div className="glass-panel p-2">
          {/* Header */}
          <div className="px-6 py-5 flex justify-between items-center bg-white/[0.02] border-b border-white/[0.05] mb-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                SWAP <span className="text-[10px] bg-primary px-1.5 py-0.5 rounded uppercase translate-y-[-1px]">PRO</span>
              </h1>
              <span className="text-[10px] text-text-muted/70 font-bold uppercase tracking-[0.2em]">Institutional Engine</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 text-text-muted hover:text-white transition-all bg-white/[0.05] rounded-2xl border border-white/[0.05]"><RefreshCw className="w-4 h-4" /></button>
              <button className="p-2.5 text-text-muted hover:text-white transition-all bg-white/[0.05] rounded-2xl border border-white/[0.05]"><Settings2 className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="px-3 pb-3 space-y-2">
            {/* Input Card */}
            <div className="bg-black/40 p-6 rounded-[28px] border border-white/[0.05] transition-all focus-within:border-primary/30 group">
              <div className="flex justify-between items-center mb-6">
                <input 
                  type="text" 
                  placeholder="0.0" 
                  value={amountIn} 
                  onChange={(e) => setAmountIn(e.target.value)} 
                  className="bg-transparent text-5xl font-black outline-none w-full placeholder:text-white/10 text-white selection:bg-primary/30" 
                />
                <button 
                  onClick={() => { setSelectingFor("in"); setIsModalOpen(true); }} 
                  className="token-chip shrink-0 group-hover:border-primary/50"
                >
                  {tokenIn.logo ? <img src={tokenIn.logo} className="w-6 h-6 rounded-full object-contain" alt="" /> : <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">{tokenIn.symbol[0]}</div>}
                  <span className="font-black text-base">{tokenIn.symbol}</span>
                  <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-primary" />
                </button>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-text-muted/60">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-secondary" /> 
                  ~${(() => {
                    if (!reserves || !token0) return "0.00";
                    const isT0USDC = (token0 as string).toLowerCase() === CONTRACTS.KORTUSD.toLowerCase();
                    const [r0, r1] = reserves as [bigint, bigint, number];
                    const rUSDC = isT0USDC ? r0 : r1;
                    const rDNR = isT0USDC ? r1 : r0;
                    const price = Number(rUSDC) / Number(rDNR);
                    return (Number(amountIn || 0) * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()}
                </div>
                <button onClick={() => setAmountIn(balanceInFormatted)} className="hover:text-primary transition-all flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">Balance: {Number(balanceInFormatted).toFixed(4)} <span className="text-primary font-black">MAX</span></button>
              </div>
            </div>

            {/* Arrow Divider */}
            <div className="flex justify-center -my-6 relative z-10">
              <div className="p-1 rounded-2xl bg-black border border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <button 
                   onClick={() => { setTokenIn(tokenOut); setTokenOut(tokenIn); }}
                   className="bg-[#1C202B] p-2.5 rounded-xl text-primary hover:rotate-180 transition-all duration-500 shadow-xl border border-white/[0.05]"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Output Card */}
            <div className="bg-black/60 p-6 rounded-[28px] border border-white/[0.05] pt-10 pb-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                  {isQuoting && parsedAmountIn > 0n && <Loader2 className="w-6 h-6 animate-spin text-primary flex-shrink-0" />}
                  <p className={`text-4xl font-black tracking-tight truncate ${amountOut ? 'text-white' : 'text-white/10'}`}>
                    {amountOut ? Number(amountOut).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : "0.00"}
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectingFor("out"); setIsModalOpen(true); }} 
                  className="bg-primary hover:bg-primary-dark text-white min-w-[140px] h-14 px-6 rounded-full font-black shadow-[0_10px_20px_rgba(251,17,142,0.3)] text-base shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-3 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                  {tokenOut.logo ? <img src={tokenOut.logo} className="w-6 h-6 rounded-full bg-white/20 p-0.5 object-contain" alt="" /> : <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{tokenOut.symbol[0]}</div>}
                  <span className="whitespace-nowrap">{tokenOut.symbol}</span>
                </button>
              </div>
              <div className="mt-4 flex justify-between items-center">
                 <div className="text-[11px] font-black text-text-muted/60 uppercase tracking-widest">Balance: {Number(balanceOutFormatted).toFixed(4)}</div>
                 <div className="text-[10px] font-black text-secondary uppercase animate-pulse">Live Price Resolution</div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-[22px] flex flex-col gap-2">
               <div className="flex justify-between text-[11px] font-bold text-text-muted tracking-tight">
                  <span className="flex items-center gap-1.5"><Info className="w-3 h-3" /> Price Impact</span>
                  <span className="text-secondary">&lt; 0.01%</span>
               </div>
               <div className="flex justify-between text-[11px] font-bold text-text-muted tracking-tight">
                  <span>Routing</span>
                  <span className="text-white">DNR &rarr; USDC.k (Bridged Pool)</span>
               </div>
               <div className="flex justify-between text-[11px] font-bold text-text-muted tracking-tight">
                  <span>Network Fee</span>
                  <span className="text-white">~$0.02 Kortana Gas</span>
               </div>
            </div>

            {/* Main Action */}
            <div className="pt-2">
              <Button 
                onClick={handleSwap} 
                disabled={!isConnected || !amountIn || isPending || isConfirming} 
                className="action-button relative group overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                   {isPending || isConfirming ? <Loader2 className="animate-spin w-7 h-7" /> : (
                     <>
                        {needsApproval ? `Grant Permission for ${tokenIn.symbol}` : "Execute Atomic Swap"}
                     </>
                   )}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 group-hover:h-full transition-all duration-300 opacity-0 group-hover:opacity-10 pointer-events-none" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="mt-6 flex justify-between px-4">
           {reserves && token0 && (
             (() => {
                const isT0USDC = (token0 as string).toLowerCase() === CONTRACTS.KORTUSD.toLowerCase();
                const [r0, r1] = reserves as [bigint, bigint, number];
                const rUSDC = isT0USDC ? r0 : r1;
                const rDNR = isT0USDC ? r1 : r0;
                
                // Calculate based on 18 decimals for both tokens (standard for this DEX)
                const livePriceVal = Number(rUSDC) / Number(rDNR);
                const totalLiq = (Number(rUSDC) / 1e18) * 2;

                return (
                  <>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Omega Liquidity</span>
                        <span className="text-sm font-bold text-white">
                          ${totalLiq.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">DNR Valuation</span>
                        <span className="text-sm font-bold text-primary font-mono">
                          ${livePriceVal.toFixed(2)}
                        </span>
                    </div>
                  </>
                );
             })()
           )}
        </div>

        <TxStatusModal 
          isOpen={isStatusModalOpen}
          onClose={() => {
             setIsStatusModalOpen(false);
             reset();
             if (isSuccess && activeStep === "success") setActiveStep("idle");
          }}
          title={activeStep === "approving" ? "Approving Sovereign Access" : "Executing Atomic Swap"}
          status={isConfirming || isPending ? "pending" : isSuccess ? "success" : "error"}
          hash={hash || undefined}
          message={error ? (error as any).shortMessage || error.message : undefined}
        />
        
        <TokenSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={(t) => {
          if (selectingFor === "in") { if (t.address === tokenOut.address) setTokenOut(tokenIn); setTokenIn(t); }
          else { if (t.address === tokenIn.address) setTokenIn(tokenOut); setTokenOut(t); }
          setIsModalOpen(false);
        }} />
      </div>

      <style jsx>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
