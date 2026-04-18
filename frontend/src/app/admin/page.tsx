"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Database, 
  Zap, 
  Server,
  AlertTriangle,
  ArrowUpRight,
  Lock
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { ORACLE_ABI, FARM_ABI, STABILIZER_ABI, ERC20_ABI } from "@/lib/abis";
import { formatUnits, parseUnits } from "viem";
import { TxStatusModal } from "@/components/TxStatusModal";

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const [activeStep, setActiveStep] = useState<"idle" | "executing" | "success">("idle");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // ─── Security Governance ───
  const ADMIN_ADDRESS = "0x78a4817457C9596B26056505658097b8377eD0Ba1C19"; // Founder Wallet
  const hasAccess = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // ─── Governance Parameters ───
  const [targetDnrPrice, setTargetDnrPrice] = useState("");
  const [targetKusdPrice, setTargetKusdPrice] = useState("1.00");
  const [rewardRate, setRewardRate] = useState("");
  const [mintAmount, setMintAmount] = useState("");

  // ─── Protocol Reads ───
  const { data: oracleAddress } = useReadContract({
    address: CONTRACTS.STABILIZER as `0x${string}`,
    abi: STABILIZER_ABI,
    functionName: "oracle",
  });

  const { data: currentDnrPrice } = useReadContract({
    address: (oracleAddress as `0x${string}`) || undefined,
    abi: ORACLE_ABI,
    functionName: "getCollateralPrice",
  });

  const { data: currentRewardRate } = useReadContract({
    address: CONTRACTS.FARM as `0x${string}`,
    abi: FARM_ABI,
    functionName: "rewardPerBlock",
  });

  // ─── Governance Writes ───
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const updateOracle = () => {
    if (!targetDnrPrice || !targetKusdPrice || !oracleAddress) return;
    setActiveStep("executing");
    writeContract({
      address: oracleAddress as `0x${string}`,
      abi: ORACLE_ABI,
      functionName: "setManualPrices",
      args: [parseUnits(targetDnrPrice, 18), parseUnits(targetKusdPrice, 18)],
      type: "legacy",
    });
  };

  const handleMint = () => {
    if (!mintAmount || !address) return;
    setActiveStep("executing");
    writeContract({
      address: CONTRACTS.KORTUSD as `0x${string}`,
      abi: ERC20_ABI, // Using standard ERC20 with mint extension in next step or just custom
      functionName: "mint",
      args: [address, parseUnits(mintAmount, 18)],
      type: "legacy",
    });
  };

  const updateFarmRate = () => {
    if (!rewardRate) return;
    setActiveStep("executing");
    writeContract({
      address: CONTRACTS.FARM as `0x${string}`,
      abi: FARM_ABI,
      functionName: "setRewardPerBlock",
      args: [parseUnits(rewardRate, 18)],
      type: "legacy",
    });
  };

  useEffect(() => {
    if (isPending || isConfirming || isSuccess || error) setIsStatusModalOpen(true);
    if (isSuccess && receipt?.status === "success" && activeStep === "executing") {
      setActiveStep("success");
    }
  }, [isPending, isConfirming, isSuccess, error, receipt, activeStep]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D111C] p-6 text-center">
         <div className="w-24 h-24 bg-red-500/10 rounded-[32px] border border-red-500/20 flex items-center justify-center mb-8 animate-pulse">
            <Lock className="w-10 h-10 text-red-500" />
         </div>
         <h1 className="text-4xl font-black  tracking-tighter text-white mb-4 uppercase">Restricted Access</h1>
         <p className="text-text-muted max-w-md font-medium text-sm leading-relaxed mb-10">
            This module contains root-level protocol controls. Connecting with the Genesis Deployer wallet is required to unlock this terminal.
         </p>
         {!isConnected ? (
            <div className="p-1 px-2 bg-white/5 rounded-2xl border border-white/10">
               {/* Connect button will show from layout */}
               <p className="text-[10px] font-black uppercase tracking-widest p-4 text-primary ">Awaiting Founder Connection...</p>
            </div>
         ) : (
            <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[40px] max-w-sm">
               <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Unauthorized Signature</p>
               <p className="text-[10px] font-black text-text-muted break-all uppercase ">{address}</p>
            </div>
         )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-20 bg-[#0D111C] min-h-screen animate-in fade-in duration-700">
      <div className="w-full max-w-6xl px-8 space-y-12">
        {/* Admin Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <div className="flex items-center gap-3 text-red-500 mb-2">
                 <ShieldCheck className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Genesis Protocol Access</span>
              </div>
              <h1 className="text-5xl font-black  tracking-tighter text-white">Kortana Ops Center</h1>
           </div>
           <div className="flex gap-4">
              <div className="bg-[#131A2A] border border-border p-4 rounded-2xl flex items-center gap-4">
                 <Activity className="w-5 h-5 text-primary" />
                 <div>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Network Status</p>
                    <p className="text-sm font-bold text-white uppercase  tracking-wider">Zeus Mainnet Genesis (9002)</p>
                 </div>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Section 1: Oracle & Supply (Primary Tools) */}
           <div className="lg:col-span-2 space-y-10">
              <Card className="p-10 bg-[#131A2A] border-border/50 rounded-[40px] shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                 
                 <div className="flex items-center gap-6 mb-12 relative z-10">
                    <div className="p-4 bg-primary/10 rounded-2xl"><TrendingUp className="w-8 h-8 text-primary" /></div>
                    <div>
                        <h2 className="text-3xl font-black  tracking-tighter text-white">Price Genesis & Minting</h2>
                        <p className="text-sm text-text-muted font-medium">Inject initial USDC.k supply and establish DNR market value.</p>
                    </div>
                 </div>

                 <div className="space-y-10 mb-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block ml-2">Current DNR Value</label>
                           <div className="bg-[#0D111C] border border-border px-6 py-4 rounded-2xl text-2xl font-black text-primary ">
                              ${currentDnrPrice ? formatUnits(currentDnrPrice as bigint, 18) : "0.0000"}
                           </div>
                       </div>
                       <div className="space-y-4">
                           <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block ml-2">New Target Price ($)</label>
                           <input 
                             type="number" 
                             placeholder="e.g. 0.10"
                             value={targetDnrPrice}
                             onChange={(e) => setTargetDnrPrice(e.target.value)}
                             className="w-full h-16 bg-[#191B1F] border border-border px-6 rounded-2xl text-2xl font-black outline-none focus:border-primary transition-all tabular-nums  text-white"
                           />
                       </div>
                    </div>
                    <Button onClick={updateOracle} disabled={!isConnected || isPending || isConfirming} className="w-full h-16 text-lg font-black rounded-2xl shadow-xl">
                       Update Global Oracle Feed
                    </Button>
                 </div>

                 <div className="pt-10 border-t border-border/50 space-y-8 relative z-10">
                    <div className="flex items-center gap-4">
                       <Database className="w-6 h-6 text-primary" />
                       <h3 className="font-black  text-xl uppercase tracking-tighter text-white">USDC.k Founder Mint</h3>
                    </div>
                    <div className="relative group/mint">
                        <input 
                          type="number" 
                          placeholder="Amount to Mint (e.g. 500000)"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          className="w-full h-20 bg-[#0D111C] border border-border rounded-[24px] px-8 text-2xl font-black outline-none transition-all focus:border-primary pr-60 tabular-nums  text-white"
                        />
                        <Button 
                          onClick={handleMint} 
                          disabled={!isConnected || !mintAmount || isPending || isConfirming} 
                          className="absolute right-2 top-2 h-16 rounded-[18px] px-8 font-black text-sm uppercase tracking-widest bg-white text-black hover:bg-white/90"
                        >
                          Mint Seed USDC.k
                        </Button>
                    </div>
                 </div>
              </Card>

              {/* Reward Rate Calibration */}
              <Card className="p-10 bg-[#131A2A] border-border/50 rounded-[40px] shadow-2xl relative overflow-hidden">
                 <div className="flex items-center gap-6 mb-12">
                    <div className="p-4 bg-secondary/10 rounded-2xl"><Zap className="w-8 h-8 text-secondary" /></div>
                    <div>
                        <h2 className="text-3xl font-black  tracking-tighter text-white">Incentive Calibration</h2>
                        <p className="text-sm text-text-muted font-medium">Control the DNR reward velocity for the USDC.k pools.</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-[#0D111C] border border-border p-6 rounded-2xl">
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Current Reward Rate</p>
                       <p className="text-2xl font-black text-white ">{currentRewardRate ? formatUnits(currentRewardRate as bigint, 18) : "0"} DNR / Block</p>
                    </div>
                    <input 
                      type="number" 
                      placeholder="New Reward Rate"
                      value={rewardRate}
                      onChange={(e) => setRewardRate(e.target.value)}
                      className="bg-[#191B1F] border border-border p-6 rounded-2xl text-xl font-black outline-none  text-white"
                    />
                 </div>
                 <Button variant="outline" onClick={updateFarmRate} disabled={!isConnected || isPending || isConfirming} className="w-full h-16 text-lg font-black rounded-2xl border-secondary/30 text-secondary hover:bg-secondary hover:text-white bg-transparent">
                    Update Farm Emissions
                 </Button>
              </Card>
           </div>

           {/* Stats & Warnings */}
           <div className="space-y-10">
              <div className="bg-[#131A2A] border border-border p-10 rounded-[40px] shadow-2xl space-y-8">
                 <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                    <Server className="w-6 h-6 text-primary" />
                    <h3 className="font-black  text-xl uppercase tracking-tighter text-white">Protocol Status</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#0D111C] p-4 rounded-xl border border-border/30">
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Asset Sync</span>
                       <span className="text-xs font-bold text-green-500 ">USDC.k ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#0D111C] p-4 rounded-xl border border-border/30">
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Bridge Gateway</span>
                       <span className="text-xs font-bold text-primary ">LISTENING</span>
                    </div>
                 </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[40px] space-y-4">
                 <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h4 className="font-black text-xs uppercase tracking-widest">Founder Reminder</h4>
                 </div>
                 <p className="text-[11px] font-medium text-text-muted leading-relaxed uppercase tracking-tighter ">
                    Use this page to "Seed" your blockchain. Once you have minted USDC.k and set the DNR price, go to the Pools page to create the initial DNR/USDC.k liquidity.
                 </p>
              </div>
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
        title="Broadcasting Genesis Update"
        status={isConfirming || isPending ? "pending" : isSuccess ? "success" : "error"}
        hash={hash || undefined}
        message={error ? (error as any).shortMessage || error.message : undefined}
      />
    </div>
  );
}
