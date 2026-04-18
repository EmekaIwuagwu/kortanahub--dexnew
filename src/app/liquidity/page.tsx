"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Droplets,
  ChevronDown,
  TrendingUp,
  History,
  Loader2,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Settings,
  Info,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { CONTRACTS, DEFAULT_TOKENS } from "@/lib/contracts";
import { LIQUIDITY_ABI, ERC20_ABI, FACTORY_ABI, PAIR_ABI } from "@/lib/abis";
import { parseUnits, formatUnits } from "viem";
import { TokenSelectorModal } from "@/components/TokenSelectorModal";
import { TxStatusModal } from "@/components/TxStatusModal";

type Token = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isNative?: boolean;
  logo?: string;
};

export default function LiquidityPage() {
  const { isConnected, address } = useAccount();
  const [tokenA, setTokenA] = useState<Token>(DEFAULT_TOKENS[1]); // KORTUSD
  const [amountA, setAmountA] = useState("");
  const [amountDNR, setAmountDNR] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [removePercent, setRemovePercent] = useState(50);
  
  const [activeTxStep, setActiveTxStep] = useState<"idle" | "approving" | "creating_pool" | "adding" | "removing" | "success">("idle");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { data: pairAddress, refetch: refetchPair } = useReadContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: [CONTRACTS.WDNR as `0x${string}`, tokenA.address as `0x${string}`],
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenA.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.LIQUIDITY_MANAGER as `0x${string}`] : undefined,
    query: { enabled: !!address && !!tokenA.address },
  });

  const { data: tokenABalance } = useReadContract({
    address: tokenA.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenA.address },
  });

  const { data: dnrBalanceData } = useBalance({ address });
  const dnrBalanceRaw = dnrBalanceData?.value;

  const { data: lpBalance, refetch: refetchLpBalance } = useReadContract({
    address: (pairAddress as `0x${string}`) || undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const { data: reservesRaw } = useReadContract({
    address: (pairAddress as `0x${string}`) || undefined,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { enabled: !!pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const reserves = reservesRaw as [bigint, bigint, number] | undefined;

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const handleAddLiquidity = async () => {
    if (!amountA || !amountDNR || !address) return;
    const amountABig = parseUnits(amountA, tokenA.decimals);
    const amountDNRBig = parseUnits(amountDNR, 18);
    const hasAllowance = allowance !== undefined && (allowance as bigint) >= amountABig;
    const hasPool = pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000";

    if (!hasAllowance) {
      setActiveTxStep("approving");
      writeContract({
        address: tokenA.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.LIQUIDITY_MANAGER as `0x${string}`, amountABig * 1000000n],
        type: "legacy",
      });
      return;
    }

    if (!hasPool) {
      setActiveTxStep("creating_pool");
      writeContract({
        address: CONTRACTS.FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "createPair",
        args: [CONTRACTS.WDNR as `0x${string}`, tokenA.address as `0x${string}`],
        type: "legacy",
      });
      return;
    }

    setActiveTxStep("adding");
    writeContract({
      address: CONTRACTS.LIQUIDITY_MANAGER as `0x${string}`,
      abi: LIQUIDITY_ABI,
      functionName: "addLiquidityDNR",
      args: [tokenA.address as `0x${string}`, amountABig, 0n, 0n, address, BigInt(Math.floor(Date.now() / 1000) + 60 * 20)],
      value: amountDNRBig,
      type: "legacy",
    });
  };

  const handleRemoveLiquidity = () => {
    if (!lpBalance || !address || !pairAddress) return;
    setActiveTxStep("removing");
    const lpToBurn = (lpBalance as bigint * BigInt(removePercent)) / 100n;
    writeContract({
      address: pairAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [pairAddress as `0x${string}`, lpToBurn],
      type: "legacy",
    });
  };

  useEffect(() => {
    if (isSuccess && receipt?.status === "success") {
      setActiveTxStep("success");
      refetchPair();
      refetchLpBalance();
      refetchAllowance();
      if (activeTxStep === "success") {
        setTimeout(() => { setIsStatusModalOpen(false); setActiveTxStep("idle"); }, 3000);
      }
    }
  }, [isSuccess, receipt, activeTxStep, refetchPair, refetchLpBalance, refetchAllowance]);

  useEffect(() => {
    if (isPending || isConfirming || isSuccess || error) setIsStatusModalOpen(true);
  }, [isPending, isConfirming, isSuccess, error]);

  const lpBalanceUnits = lpBalance ? formatUnits(lpBalance as bigint, 18) : "0";
  const needsApproval = allowance !== undefined && (allowance as bigint) < (amountA ? parseUnits(amountA, tokenA.decimals) : 1n);
  const needsPool = pairAddress === "0x0000000000000000000000000000000000000000";

  return (
    <div className="min-h-screen bg-[#0a0d14] p-8 md:p-12 relative overflow-hidden">
      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-secondary/5 blur-[200px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto z-10 relative mt-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <History className="w-3 h-3" /> System Liquidity Mapped
             </div>
             <h2 className="text-6xl font-black text-white tracking-tighter mb-4">LIQUIDITY FORGE</h2>
             <p className="text-xl text-text-muted font-bold leading-relaxed">
                Provide capital to the sovereign DNR ecosystem. Earn 0.3% fees on every swap transacted through your pool position.
             </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="action-button md:w-64 h-20 text-2xl">
             <Plus className="w-7 h-7 mr-2" /> New Forge
          </Button>
        </div>

        {/* High-Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           {[
             { label: "DNR Pool Reserve", value: reserves ? Number(formatUnits(reserves[0], 18)).toLocaleString() : "0.00", sub: "1,000.00 DNR Seeded", icon: Droplets, color: "text-primary" },
             { label: "Asset Reserve", value: reserves ? Number(formatUnits(reserves[1], tokenA.decimals)).toLocaleString() : "0.00", sub: `${tokenA.symbol} Pool Depth`, icon: TrendingUp, color: "text-secondary" },
             { label: "Your Stake", value: Number(lpBalanceUnits).toFixed(4), sub: "Total LP Units Held", icon: ShieldCheck, color: "text-white" },
           ].map((stat, i) => (
             <div key={i} className="glass-panel p-10 group hover:border-primary/40 transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                   <div className={`p-5 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform shadow-xl`}>
                      <stat.icon className="w-9 h-9" />
                   </div>
                   <Info className="w-5 h-5 text-text-muted/30" />
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                <h3 className="text-4xl font-black text-white tracking-tighter mb-1">{stat.value}</h3>
                <p className="text-xs text-text-muted font-bold tracking-tight opacity-60 italic">{stat.sub}</p>
             </div>
           ))}
        </div>

        {/* Positions Manifest */}
        <div className="glass-panel overflow-hidden">
           <div className="px-8 py-6 border-b border-white/[0.05] bg-white/[0.02] flex justify-between items-center">
              <h3 className="font-black text-xl text-white tracking-tight uppercase">Active Position Manifest</h3>
              <div className="flex gap-4">
                 <button className="text-[10px] font-black text-text-muted uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:text-white transition-colors">
                    Global Pools
                 </button>
                 <button className="text-[10px] font-black text-white uppercase tracking-widest px-4 py-2 rounded-xl bg-primary shadow-[0_0_15px_rgba(251,17,142,0.3)]">
                    Managed
                 </button>
              </div>
           </div>

           {!isConnected ? (
              <div className="py-32 flex flex-col items-center justify-center text-center px-12">
                 <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/5">
                    <Droplets className="w-12 h-12 text-text-muted/20" />
                 </div>
                 <p className="text-2xl font-black text-white mb-4">DECRYPTING WALLET...</p>
                 <p className="text-text-muted font-bold max-w-sm leading-relaxed mb-10">Connect your institutional wallet to the Kortana Mainnet to manifest your liquidity positions.</p>
                 <Button className="px-12 h-16 rounded-2xl action-button text-xl">Connect Protocol</Button>
              </div>
           ) : Number(lpBalanceUnits) > 0 ? (
              <div className="p-10 space-y-6">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-10 p-10 bg-black/40 rounded-[40px] border border-white/[0.05] group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-8">
                       <div className="flex -space-x-4">
                          <img src="https://dex.kortana.xyz/logo.png" className="w-20 h-20 rounded-full bg-white/10 p-1.5 border-[6px] border-[#0a0d14] shadow-2xl" alt="" />
                          <img src={tokenA.logo || ""} className="w-20 h-20 rounded-full bg-white/10 p-1.5 border-[6px] border-[#0a0d14] shadow-2xl translate-y-2" alt="" />
                       </div>
                       <div>
                          <p className="text-3xl font-black text-white tracking-tighter uppercase">DNR-{tokenA.symbol} FORGE</p>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-[10px] text-secondary font-black tracking-widest">SOVEREIGN V2</div>
                             <div className="flex items-center gap-1.5 text-text-muted/60 text-[10px] font-black tracking-widest"><TrendingUp className="w-3 h-3" /> 0.3% Fee Tier</div>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-16">
                       <div className="hidden lg:block">
                          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mb-1">Unit Weight</p>
                          <p className="text-3xl font-black text-white tabular-nums">{Number(lpBalanceUnits).toFixed(4)} <span className="text-lg opacity-30">LP</span></p>
                       </div>
                       <div className="flex gap-3">
                           <button onClick={() => setShowRemoveForm(true)} className="px-8 h-16 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-red-500/10 hover:border-red-500/30 transition-all">
                              Melt Forge
                           </button>
                           <button onClick={() => setShowAddForm(true)} className="px-8 h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-[0_10px_20px_rgba(251,17,142,0.2)] hover:shadow-[0_15px_30px_rgba(251,17,142,0.4)] transition-all">
                              Inject Capital
                           </button>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="py-40 flex flex-col items-center justify-center text-center px-12">
                 <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mb-12 border border-white/5 rotate-12">
                    <Droplets className="w-16 h-16 text-primary drop-shadow-[0_0_20px_rgba(251,17,142,0.4)]" />
                 </div>
                 <h3 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase">Forge is Currently Cold</h3>
                 <p className="text-xl text-text-muted font-bold max-w-md leading-relaxed mb-12">
                    You have not manifested any positions in the DNR ecosystem. Initialize your first forge to begin collecting protocol fees.
                 </p>
                 <Button onClick={() => setShowAddForm(true)} className="px-16 h-20 rounded-[32px] action-button text-2xl">
                    Initialize Sovereign Forge
                 </Button>
              </div>
           )}
        </div>
      </div>

      {/* Forging Modal (Add Form) */}
      {showAddForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-[520px] glass-panel p-2 shadow-[0_0_120px_rgba(251,17,142,0.1)]">
              <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setShowAddForm(false)} className="p-2.5 rounded-xl bg-white/5 hover:text-primary transition-all"><ArrowLeft className="w-6 h-6" /></button>
                    <span className="text-2xl font-black text-white tracking-tighter uppercase">Initialize Forge</span>
                 </div>
                 <Settings className="w-5 h-5 text-text-muted/40" />
              </div>

              <div className="p-6 space-y-3">
                 <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 group focus-within:border-primary/30 transition-all">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Anchor DNR</span>
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 text-white font-black text-base shadow-xl italic uppercase">
                           <img src="https://dex.kortana.xyz/logo.png" className="w-6 h-6 rounded-full" alt="" /> DNR
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                       <input type="number" placeholder="0.0" value={amountDNR} onChange={(e) => setAmountDNR(e.target.value)} className="bg-transparent text-6xl font-black outline-none w-full placeholder:text-white/5 tabular-nums text-white" />
                       <div className="text-right">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Balance</p>
                          <p className="text-sm font-bold text-white/40 tabular-nums">
                             {Number(formatUnits(dnrBalanceRaw || 0n, 18)).toFixed(4)}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-center -my-8 relative z-10 scale-125">
                    <div className="bg-[#0a0d14] border-[6px] border-white/5 p-4 rounded-3xl text-primary shadow-[0_0_40px_rgba(251,17,142,0.2)] animate-pulse">
                        <Plus className="w-8 h-8" />
                    </div>
                 </div>

                 <div className="bg-black/60 p-8 rounded-[32px] border border-white/5 group focus-within:border-secondary/30 transition-all pb-12">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Target Asset</span>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 px-5 py-2.5 bg-secondary text-black rounded-2xl font-black text-base shadow-xl italic uppercase hover:scale-105 active:scale-95 transition-all">
                           {tokenA.logo && <img src={tokenA.logo} className="w-6 h-6 rounded-full bg-black/20 p-0.5" alt="" />}
                           {tokenA.symbol} <ChevronDown className="w-5 h-5 opacity-40" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                       <input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} className="bg-transparent text-6xl font-black outline-none w-full placeholder:text-white/5 tabular-nums text-white" />
                       <div className="text-right">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Balance</p>
                          <p className="text-sm font-bold text-white/40 tabular-nums">
                             {Number(formatUnits(tokenABalance as bigint || 0n, tokenA.decimals)).toFixed(4)}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="py-2" />
                 
                 <Button onClick={handleAddLiquidity} disabled={!amountA || !amountDNR || isPending || isConfirming} className="action-button h-24 text-3xl font-black group relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-center gap-4">
                       {isPending || isConfirming ? <Loader2 className="animate-spin w-8 h-8" /> : (
                         <>{needsApproval ? `Grant Permission` : needsPool ? "Initialize Forge" : "Manifest Forge"}</>
                       )}
                    </div>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                 </Button>

                 <div className="mt-4 flex items-center gap-3 justify-center text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">
                   <ShieldCheck className="w-4 h-4" /> Locked Security manifest Active
                 </div>
              </div>
           </div>
           <TokenSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={(t) => { setTokenA(t); setIsModalOpen(false); }} />
        </div>
      )}

      {/* Melt Forge Modal (Remove Form) */}
      {showRemoveForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-[480px] glass-panel p-2">
              <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Melt Position</h3>
                 <button onClick={() => setShowRemoveForm(false)} className="text-text-muted/40 hover:text-white transition-all text-2xl">✕</button>
              </div>
              <div className="p-8">
                 <div className="bg-black/50 p-10 rounded-[40px] border border-white/5 mb-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em] mb-6">Melt Percentage</p>
                    <h2 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tracking-tighter">{removePercent}%</h2>
                    <div className="flex justify-center gap-3 mt-10">
                       {[25, 50, 75, 100].map(p => (
                         <button key={p} onClick={() => setRemovePercent(p)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${removePercent === p ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}>{p}%</button>
                       ))}
                    </div>
                 </div>
                 <Button className="w-full h-20 rounded-[28px] bg-white text-black hover:bg-white/90 font-black text-xl uppercase tracking-tighter" onClick={handleRemoveLiquidity} disabled={isPending || isConfirming}>
                    {isPending || isConfirming ? <Loader2 className="animate-spin" /> : "Initiate Thermal Melt"}
                 </Button>
                 <p className="mt-8 text-center text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">Assets will be returned to wallet instantly</p>
              </div>
           </div>
        </div>
      )}

      <TxStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); reset(); }}
        title={activeTxStep === "approving" ? "AUTHENTICATING FORGE" : activeTxStep === "removing" ? "THERMAL MELT ACTIVE" : "FORGE GENESIS"}
        status={isConfirming || isPending ? "pending" : isSuccess ? "success" : "error"}
        hash={hash || undefined}
        message={error ? (error as any).shortMessage || error.message : undefined}
      />
    </div>
  );
}
