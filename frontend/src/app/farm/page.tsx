"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Sprout, 
  Coins, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { FARM_ABI, ERC20_ABI } from "@/lib/abis";
import { formatUnits, parseUnits } from "viem";
import { TxStatusModal } from "@/components/TxStatusModal";

export default function FarmPage() {
  const { isConnected, address } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  
  // Transaction State machine
  const [activeStep, setActiveStep] = useState<"idle" | "approving" | "staking" | "unstaking" | "claiming" | "success">("idle");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // ─── Contract Reads ───
  const { data: lpTokenAddress } = useReadContract({
    address: CONTRACTS.FARM as `0x${string}`,
    abi: FARM_ABI,
    functionName: "lpToken",
  });

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: CONTRACTS.FARM as `0x${string}`,
    abi: FARM_ABI,
    functionName: "userInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: (lpTokenAddress as `0x${string}`) || undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.FARM as `0x${string}`] : undefined,
    query: { enabled: !!address && !!lpTokenAddress },
  });

  const { data: pendingReward, refetch: refetchPending } = useReadContract({
    address: CONTRACTS.FARM as `0x${string}`,
    abi: FARM_ABI,
    functionName: "pendingReward",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ─── Contract Writes ───
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const handleStake = async () => {
    if (!stakeAmount || !address || !lpTokenAddress) return;
    const amountBig = parseUnits(stakeAmount, 18);

    // PROFESSIONAL DEBUGGING
    console.log("🚀 [FARM] STAKE_AUDIT:", {
      token: lpTokenAddress,
      amount: stakeAmount,
      user: address
    });

    if (allowance !== undefined && (allowance as bigint) < amountBig) {
      setActiveStep("approving");
      writeContract({
        address: lpTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.FARM as `0x${string}`, amountBig * 1000n],
      });
      return;
    }

    setActiveStep("staking");
    writeContract({
      address: CONTRACTS.FARM as `0x${string}`,
      abi: FARM_ABI,
      functionName: "deposit",
      args: [amountBig],
      type: "legacy",
      gas: 300000n,
    });
  };

  const handleUnstake = () => {
    if (!unstakeAmount) return;
    setActiveStep("unstaking");
    writeContract({
      address: CONTRACTS.FARM as `0x${string}`,
      abi: FARM_ABI,
      functionName: "withdraw",
      args: [parseUnits(unstakeAmount, 18)],
    });
  };

  const handleClaim = () => {
    setActiveStep("claiming");
    writeContract({
      address: CONTRACTS.FARM as `0x${string}`,
      abi: FARM_ABI,
      functionName: "deposit",
      args: [0n],
    });
  };

  useEffect(() => {
    if (isSuccess && receipt?.status === "success") {
      if (activeStep === "approving") refetchAllowance();
      else if (activeStep === "staking" || activeStep === "unstaking" || activeStep === "claiming") {
        refetchUserInfo();
        refetchPending();
        setActiveStep("success");
      }
    }
  }, [isSuccess, receipt, activeStep, refetchAllowance, refetchUserInfo, refetchPending]);

  useEffect(() => {
    if (isPending || isConfirming || isSuccess || error) setIsStatusModalOpen(true);
  }, [isPending, isConfirming, isSuccess, error]);

  const needsApproval = allowance !== undefined && stakeAmount && parseUnits(stakeAmount, 18) > (allowance as bigint);
  const rewards = pendingReward ? (pendingReward as bigint) : 0n;

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 animate-in fade-in duration-700">
      <header className="mb-16 flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black mb-4 flex items-center gap-4  tracking-tighter">
            <div className="bg-primary/20 p-3 rounded-2xl"><Sprout className="w-10 h-10 text-primary" /></div> 
            Protocol Incentives
          </h2>
          <p className="text-text-muted text-xl font-medium max-w-xl">
            Bootstrap the Kortana economy. Stake LP tokens to earn <span className="text-primary  font-black">DNR</span> rewards per block.
          </p>
        </div>
        <div className="hidden md:block bg-[#131A2A] border border-border p-6 rounded-[32px] text-right min-w-[300px] shadow-2xl">
           <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">Total Value Locked</p>
           <p className="text-4xl font-black  tracking-tighter">$464,281.00 <TrendingUp className="inline w-6 h-6 text-primary ml-2" /></p>
        </div>
      </header>

      {/* Rewards Center */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[40px] p-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
         <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-[28px] bg-primary flex items-center justify-center text-white shadow-[0_10px_40px_rgba(251,17,142,0.4)]"><Coins className="w-10 h-10" /></div>
            <div>
               <p className="text-[12px] font-black text-text-muted uppercase tracking-[0.4em] mb-2">Accrued DNR Incentives</p>
               <h3 className="text-5xl font-black  tracking-tighter">{isConnected ? Number(formatUnits(rewards, 18)).toFixed(4) : "0.0000"} <span className="text-primary not- text-2xl ml-2">DNR</span></h3>
            </div>
         </div>
         <Button onClick={handleClaim} disabled={!isConnected || rewards === 0n || isPending || isConfirming} className="h-20 px-12 text-xl font-black rounded-[24px] shadow-2xl relative z-10 group-hover:scale-105 transition-transform active:scale-95">
            Harvest Rewards
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* DNR-KUSD FARM */}
        <div className="bg-[#131A2A] border border-border rounded-[48px] overflow-hidden shadow-2xl flex flex-col hover:border-primary/40 transition-colors duration-500 relative group">
           <div className="absolute top-4 right-8 px-4 py-1.5 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] ">High Yield</div>
           <div className="p-10 border-b border-border bg-[#1C2438]/20">
              <div className="flex items-center gap-6 mb-8">
                 <div className="flex -space-x-4">
                    <div className="w-16 h-16 rounded-[24px] bg-primary border-[4px] border-[#131A2A] flex items-center justify-center text-xs font-black shadow-xl">D</div>
                    <div className="w-16 h-16 rounded-[24px] bg-secondary border-[4px] border-[#131A2A] flex items-center justify-center text-xs font-black shadow-xl">U</div>
                 </div>
                 <div>
                    <h4 className="font-black text-3xl  tracking-tighter">DNR-USDC.k</h4>
                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase">Stability Genesis Pool</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#0D111C] p-4 rounded-2xl border border-border/50">
                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Estimated APY</p>
                    <p className="text-3xl font-black text-primary  tracking-tight">1,420%</p>
                 </div>
                 <div className="bg-[#0D111C] p-4 rounded-2xl border border-border/50">
                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1">Pool TVL</p>
                    <p className="text-3xl font-black text-white  tracking-tight">$82.5K</p>
                 </div>
              </div>
           </div>

           <div className="p-10 space-y-10 flex-1">
              <div className="space-y-4">
                 <div className="flex justify-between px-2 items-center">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Stake LP Balance</span>
                    <span className="text-xs font-bold text-primary ">MAX</span>
                 </div>
                 <div className="relative group/input">
                    <input type="number" placeholder="0.00" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="w-full h-20 bg-[#191B1F]/50 border border-border rounded-[24px] px-8 text-2xl font-black outline-none transition-all focus:border-primary focus:bg-[#191B1F]/80 pr-40 tabular-nums " />
                    <Button onClick={handleStake} disabled={!isConnected || isPending || isConfirming} className="absolute right-2 top-2 h-16 rounded-[18px] px-8 font-black text-xs uppercase tracking-widest">
                      {isPending || isConfirming ? <Loader2 className="animate-spin w-5 h-5" /> : (needsApproval ? "Approve" : "Stake LP")}
                    </Button>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between px-2 items-center">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Unstake Rewards</span>
                 </div>
                 <div className="relative">
                    <input type="number" placeholder="0.00" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} className="w-full h-16 bg-[#191B1F]/10 border border-border/30 rounded-[24px] px-8 text-xl font-bold outline-none pr-40 tabular-nums " />
                    <Button variant="outline" onClick={handleUnstake} disabled={!isConnected || isPending || isConfirming} className="absolute right-2 top-2 h-12 rounded-[18px] px-8 font-black text-[10px] bg-[#1C2438] border-border hover:border-primary transition-all uppercase tracking-widest">Unstake</Button>
                 </div>
              </div>
           </div>
        </div>

        {/* INFO COLUMN */}
        <div className="space-y-10">
           <div className="p-12 h-1/2 bg-[#131A2A] border border-border rounded-[48px] text-left flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <Sprout className="w-16 h-16 text-primary mb-8" />
              <h3 className="text-4xl font-black  tracking-tighter mb-6">MasterChef Protocol</h3>
              <p className="text-text-muted font-medium text-lg leading-relaxed mb-6">
                 By staking LP tokens, you provide depth to the Kortana economy. Rewards are distributed proportionally per block confirmed on the Network.
              </p>
              <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest  group cursor-pointer hover:gap-4 transition-all">
                 Learn about yield <ArrowRight className="w-4 h-4" />
              </div>
           </div>

           <div className="p-12 h-1/2 bg-[#191B1F]/30 border border-dashed border-border rounded-[48px] flex flex-col justify-center items-center text-center group">
              <div className="w-24 h-24 rounded-[32px] bg-[#1C2438] border border-border mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                 <Plus className="w-12 h-12 text-text-muted" />
              </div>
              <h4 className="text-2xl font-black  tracking-tighter text-white/50 mb-2">Upcoming: DNR-USDC.k</h4>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Phase 2 Ignition</p>
              <p className="text-sm text-text-muted font-medium max-w-[280px]">
                 Bridge real USDC from Ethereum to unlock the next level of Kortana incentives.
              </p>
           </div>
        </div>
      </div>

      <TxStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => {
           setIsStatusModalOpen(false);
           reset();
           if (isSuccess && activeStep === "success") setActiveStep("idle");
        }}
        title={activeStep === "approving" ? "Approving LP Delegation" : "Reserve Sync"}
        status={isConfirming || isPending ? "pending" : isSuccess ? "success" : "error"}
        hash={hash || undefined}
        message={error ? (error as any).shortMessage || error.message : undefined}
      />
    </div>
  );
}
