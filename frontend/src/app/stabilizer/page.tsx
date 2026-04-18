"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ShieldCheck, 
  Info,
  Lock,
  Unlock,
  AlertCircle,
  Activity,
  ArrowRight,
  Loader2,
  TrendingUp,
  Dna
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { STABILIZER_ABI, ERC20_ABI, ORACLE_ABI } from "@/lib/abis";
import { formatUnits, parseUnits } from "viem";
import { TxStatusModal } from "@/components/TxStatusModal";

export default function StabilizerPage() {
  const { isConnected, address } = useAccount();
  const [tab, setTab] = useState<"mint" | "burn">("mint");
  const [amount, setAmount] = useState("");
  
  // Transaction State machine (Sequential Flow)
  const [activeStep, setActiveStep] = useState<"idle" | "approving" | "executing" | "success">("idle");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // ─── Contract Reads (Protocol Specs) ───
  const { data: collateralToken } = useReadContract({
    address: CONTRACTS.STABILIZER as `0x${string}`,
    abi: STABILIZER_ABI,
    functionName: "collateralToken",
  });

  const { data: oracleAddress } = useReadContract({
    address: CONTRACTS.STABILIZER as `0x${string}`,
    abi: STABILIZER_ABI,
    functionName: "oracle",
  });

  const { data: cRatio } = useReadContract({
    address: CONTRACTS.STABILIZER as `0x${string}`,
    abi: STABILIZER_ABI,
    functionName: "collateralRatio",
  });

  // ─── Oracle Data (The "Declared" Price) ───
  const { data: dnrPriceRaw } = useReadContract({
    address: (oracleAddress as `0x${string}`) || undefined,
    abi: ORACLE_ABI,
    functionName: "getCollateralPrice",
    query: { enabled: !!oracleAddress },
  });

  // ─── Allowances ───
  const { data: collateralAllowance, refetch: refetchCollateralAllowance } = useReadContract({
    address: (collateralToken as `0x${string}`) || undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.STABILIZER as `0x${string}`] : undefined,
    query: { enabled: !!address && !!collateralToken },
  });

  const { data: kusdAllowance, refetch: refetchKusdAllowance } = useReadContract({
    address: CONTRACTS.KORTUSD as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.STABILIZER as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  // ─── Contract Writes ───
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const handleAction = async () => {
    if (!amount || !address) return;
    const parsedAmount = parseUnits(amount, 18);
    
    // PROFESSIONAL AUDIT LOG
    console.log("🚀 [STABILIZER] PROTOCOL_GENESIS:", {
      type: tab,
      collateralUsed: amount,
      targetPeg: "1.00 USD",
      dnrDeclaredPrice: dnrPriceRaw ? formatUnits(dnrPriceRaw as bigint, 18) : "N/A"
    });

    // Step 1: Force Approval Sequence
    if (tab === "mint") {
       if (collateralAllowance !== undefined && (collateralAllowance as bigint) < parsedAmount) {
         setActiveStep("approving");
         writeContract({
           address: collateralToken as `0x${string}`,
           abi: ERC20_ABI,
           functionName: "approve",
           args: [CONTRACTS.STABILIZER as `0x${string}`, parsedAmount * 100n],
           type: "legacy",
           gas: 100000n,
         });
         return;
       }
    } else {
       if (kusdAllowance !== undefined && (kusdAllowance as bigint) < parsedAmount) {
         setActiveStep("approving");
         writeContract({
           address: CONTRACTS.KORTUSD as `0x${string}`,
           abi: ERC20_ABI,
           functionName: "approve",
           args: [CONTRACTS.STABILIZER as `0x${string}`, parsedAmount * 100n],
           type: "legacy",
           gas: 100000n,
         });
         return;
       }
    }

    // Step 2: Finalize Burn/Mint
    setActiveStep("executing");
    if (tab === "mint") {
      writeContract({
        address: CONTRACTS.STABILIZER as `0x${string}`,
        abi: STABILIZER_ABI,
        functionName: "mint",
        args: [parsedAmount, 0n], // 0n slippage for Production Mainnet
        type: "legacy", 
        gas: 400000n,
      });
    } else {
      writeContract({
        address: CONTRACTS.STABILIZER as `0x${string}`,
        abi: STABILIZER_ABI,
        functionName: "burn",
        args: [parsedAmount, 0n],
        type: "legacy",
        gas: 400000n,
      });
    }
  };

  useEffect(() => {
    if (isSuccess && receipt?.status === "success") {
       if (activeStep === "approving") {
         refetchCollateralAllowance();
         refetchKusdAllowance();
       } else if (activeStep === "executing") {
         setActiveStep("success");
         setAmount("");
       }
    }
  }, [isSuccess, receipt, activeStep, refetchCollateralAllowance, refetchKusdAllowance]);

  useEffect(() => {
    if (isPending || isConfirming || isSuccess || error) setIsStatusModalOpen(true);
  }, [isPending, isConfirming, isSuccess, error]);

  const needsApproval = (() => {
    if (!amount || Number(amount) <= 0) return false;
    const currentAllowance = (tab === "mint" ? collateralAllowance : kusdAllowance) as bigint || 0n;
    return currentAllowance < parseUnits(amount, 18);
  })();

  const dnrPrice = dnrPriceRaw ? Number(formatUnits(dnrPriceRaw as bigint, 18)) : 0;
  const ratio = cRatio ? Number(cRatio) / 10000 : 0.8;
  const projection = amount ? (Number(amount) * dnrPrice) / ratio : 0;

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-12 animate-in slide-in-from-bottom-6 duration-1000">
      <div className="w-full max-w-[580px] space-y-8">
        {/* Market Stats Bar */}
        <div className="flex justify-between gap-4 px-2">
           <div className="flex-1 bg-[#131A2A] border border-border p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">DNR Oracle Price</p>
                <p className="text-xl font-black text-primary  ">${dnrPrice.toFixed(4)}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary opacity-50" />
           </div>
           <div className="flex-1 bg-[#131A2A] border border-border p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Peg Target</p>
                <p className="text-xl font-black text-white  ">$1.0000</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-white opacity-50" />
           </div>
        </div>

        {/* Main Vault UI */}
        <div className="bg-[#131A2A] border border-border rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative border-t-primary/20">
          <div className="flex bg-[#191B1F]/60 p-2 rounded-t-[40px] border-b border-border/50">
            <button onClick={() => { setTab("mint"); setActiveStep("idle"); }} className={`flex-1 py-5 font-black text-[10px] uppercase tracking-[0.3em] rounded-[32px] transition-all flex items-center justify-center gap-2 ${tab === "mint" ? "bg-[#1C2438] text-primary border border-primary/20 shadow-lg" : "text-text-muted hover:text-white"}`}>
               <Lock className="w-3.5 h-3.5" /> Deposit & Generate
            </button>
            <button onClick={() => { setTab("burn"); setActiveStep("idle"); }} className={`flex-1 py-5 font-black text-[10px] uppercase tracking-[0.3em] rounded-[32px] transition-all flex items-center justify-center gap-2 ${tab === "burn" ? "bg-[#1C2438] text-primary border border-primary/20 shadow-lg" : "text-text-muted hover:text-white"}`}>
               <Unlock className="w-3.5 h-3.5" /> Burn & Withdraw
            </button>
          </div>

          <div className="p-10">
            <div className="space-y-8 mb-10">
               <div className="bg-[#191B1F]/60 p-8 rounded-[32px] border border-border focus-within:border-primary/50 transition-all shadow-inner relative group">
                  <div className="flex justify-between items-center gap-8">
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="bg-transparent text-6xl font-black outline-none w-full placeholder:text-[#3B455C]  tracking-tighter" 
                    />
                    <div className="flex flex-col items-end">
                      <div className="bg-[#1C2438] px-5 py-2.5 rounded-2xl text-[12px] font-black border border-border tracking-widest shadow-sm">{tab === "mint" ? "DNR" : "USDC.k"}</div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-4 text-[8px] font-black text-primary group-focus-within:opacity-100 opacity-20 transition-opacity">INPUT RESERVE</div>
               </div>

               <div className="flex justify-center -my-8 relative z-20"><div className="bg-[#131A2A] border-[6px] border-[#0D111C] p-3 rounded-2xl text-primary shadow-2xl"><ArrowRight className="w-6 h-6 rotate-90" /></div></div>

               <div className="bg-[#191B1F]/30 p-8 rounded-[32px] border border-dashed border-border/30 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-3 relative z-10">Estimated Capital Injection</p>
                  <p className="text-5xl font-black  tracking-tighter text-white relative z-10">{projection > 0 ? projection.toFixed(2) : "0.00"} <span className="text-primary text-3xl not- ml-2">{tab === "mint" ? "USDC.k" : "DNR"}</span></p>
               </div>
            </div>

            <Button onClick={handleAction} disabled={!isConnected || !amount || isPending || isConfirming} className="w-full h-20 text-2xl font-black rounded-[32px] shadow-[0_20px_60px_rgba(251,17,142,0.2)] group transition-all hover:scale-[1.02] active:scale-[0.98]">
               {isPending || isConfirming ? <Loader2 className="animate-spin w-8 h-8" /> : (needsApproval ? `Approve Collateral` : (tab === "mint" ? "Initiate Capital Genesis" : "De-stabilize Position"))}
            </Button>
          </div>
          
          <div className="px-10 py-6 bg-[#1C2438]/40 border-t border-border flex justify-between items-center group">
             <div className="flex items-center gap-4">
                <Dna className="w-5 h-5 text-primary animate-pulse" />
                <div>
                   <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] block">PROTOCOL STATUS</span>
                   <span className="text-[11px] font-bold text-white uppercase  tracking-wider">COLLATERAL RATIO: {(ratio*100).toFixed(0)}% (ALGOSIG v1)</span>
                </div>
             </div>
             <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(251,17,142,1)]" />
          </div>
        </div>
        
        {/* Tooltip Card */}
        <div className="bg-[#131A2A]/50 border border-border p-6 rounded-3xl flex items-start gap-4">
           <Info className="w-6 h-6 text-primary shrink-0" />
           <p className="text-[11px] font-medium text-text-muted leading-relaxed uppercase tracking-tighter ">This protocol enables the creation of dollar-pegged KORTUSD by locking DNR as collateral. The declared DNR price is verified by the Kortana Market Oracle to ensure peg stability during the genesis phase.</p>
        </div>
      </div>

      <TxStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => {
           setIsStatusModalOpen(false);
           reset();
           if (isSuccess && activeStep === "success") setActiveStep("idle");
        }}
        title={activeStep === "approving" ? "Approving Collateral" : "Updating Reserve State"}
        status={isConfirming || isPending ? "pending" : isSuccess ? "success" : "error"}
        hash={hash || undefined}
        message={error ? (error as any).shortMessage || error.message : undefined}
      />
    </div>
  );
}
