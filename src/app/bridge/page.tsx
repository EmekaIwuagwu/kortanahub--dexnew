"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowBigRight,
  History,
  Clock,
  ChevronDown,
  Zap,
  AlertTriangle,
  Shield,
  Loader2,
  CheckCircle2,
  Globe,
  ArrowRight,
  Info,
  Network,
  Cpu,
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { ERC20_ABI, BRIDGE_ABI } from "@/lib/abis";
import { parseUnits, formatUnits } from "viem";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { TxStatusModal } from "@/components/TxStatusModal";

const CHAINS = [
  { name: "Kortana Mainnet", short: "KORT", id: 9002, icon: "K", color: "bg-primary" },
  { name: "BSC Network", short: "BSC", id: 56, icon: "B", color: "bg-yellow-500" },
  { name: "Ethereum", short: "ETH", id: 1, icon: "E", color: "bg-blue-500" },
];

const BRIDGE_TOKENS = [
  { symbol: "USDC.k", name: "Bridged USDC (Kortana)", address: CONTRACTS.KORTUSD, decimals: 18 },
  { symbol: "WDNR", name: "Wrapped Dinar", address: CONTRACTS.WDNR, decimals: 18 },
];

export default function BridgePage() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState("");
  const [destChain, setDestChain] = useState(CHAINS[1]);
  const [selectedToken, setSelectedToken] = useState(BRIDGE_TOKENS[0]);
  const [showChainSelector, setShowChainSelector] = useState(false);
  
  const [activeStep, setActiveStep] = useState<"idle" | "approving" | "bridging" | "success">("idle");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { formatted: balanceFormatted } = useTokenBalance(selectedToken);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.BRIDGE as `0x${string}`] : undefined,
  });

  const { data: bridgeFee } = useReadContract({
    address: CONTRACTS.BRIDGE as `0x${string}`,
    abi: BRIDGE_ABI,
    functionName: "bridgeFee",
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const handleBridge = async () => {
    if (!amount || !address) return;
    const parsedAmount = parseUnits(amount, selectedToken.decimals);
    const fee = (bridgeFee as bigint) || 0n;

    if (allowance !== undefined && (allowance as bigint) < parsedAmount) {
      setActiveStep("approving");
      writeContract({
        address: selectedToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.BRIDGE as `0x${string}`, parsedAmount * 1000000n],
      });
      return;
    }

    setActiveStep("bridging");
    writeContract({
      address: CONTRACTS.BRIDGE as `0x${string}`,
      abi: BRIDGE_ABI,
      functionName: "lockTokens",
      args: [selectedToken.address as `0x${string}`, parsedAmount, BigInt(destChain.id), address as `0x${string}`],
      value: fee,
      type: "legacy",
    });
  };

  useEffect(() => {
    if (isSuccess && receipt?.status === "success") {
      if (activeStep === "approving") refetchAllowance();
      else if (activeStep === "bridging") {
        setActiveStep("success");
        setAmount("");
      }
    }
  }, [isSuccess, receipt, activeStep, refetchAllowance]);

  useEffect(() => {
    if (isPending || isConfirming || isSuccess || error) setIsStatusModalOpen(true);
  }, [isPending, isConfirming, isSuccess, error]);

  const needsApproval = allowance !== undefined && amount && parseUnits(amount, selectedToken.decimals) > (allowance as bigint);

  return (
    <div className="min-h-screen bg-[#0a0d14] p-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-secondary/5 blur-[200px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50 mix-blend-overlay" />
      </div>

      <div className="z-10 relative w-full max-w-[540px] animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-12">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-text-muted text-[10px] font-black uppercase tracking-[0.4em] mb-6">
              <Network className="w-4 h-4 text-primary" /> Interstellar Asset Relay
           </div>
           <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">BRIDGE TERMINAL</h1>
           <p className="text-xl text-text-muted font-bold tracking-tight">Move your assets seamlessly between Zeus and the wider Ethereum cluster.</p>
        </div>

        <div className="glass-panel p-2">
           {/* Terminal Header */}
           <div className="px-8 py-5 flex justify-between items-center bg-white/[0.02] border-b border-white/5 mb-6">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol Version</span>
                 <h2 className="text-lg font-black text-white tracking-tighter uppercase">Sovereign Relay v2.5</h2>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-2xl border border-white/5 text-[10px] font-black text-green-500 shadow-inner">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> SECURE LINK ACTIVE
              </div>
           </div>

           <div className="px-4 pb-4 space-y-3">
              {/* Source Card */}
              <div className="bg-black/40 p-10 rounded-[40px] border border-white/5 relative group">
                 <div className="flex justify-between items-center mb-10">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Origin Network</span>
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl uppercase">
                       <Zap className="w-4 h-4" /> KORTANA MAINNET
                    </div>
                 </div>

                 <div className="flex items-center justify-between gap-8">
                    <input 
                      type="number" 
                      placeholder="0.0" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-transparent text-7xl font-black outline-none w-full placeholder:text-white/5 tabular-nums text-white"
                    />
                    <select 
                      className="bg-[#1C2438] border border-white/10 rounded-2xl px-5 py-3 text-sm font-black outline-none hover:bg-[#2D384D] transition-colors text-white uppercase"
                      value={selectedToken.symbol}
                      onChange={(e) => setSelectedToken(BRIDGE_TOKENS.find(t => t.symbol === e.target.value) || BRIDGE_TOKENS[0])}
                    >
                      {BRIDGE_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                    </select>
                 </div>

                 <div className="mt-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                    <span>Relay Fee: {bridgeFee ? formatUnits(bridgeFee as bigint, 18) : "0"} DNR</span>
                    <button onClick={() => setAmount(balanceFormatted)} className="hover:text-primary transition-all bg-white/5 px-2 py-1 rounded-lg">Balance: {Number(balanceFormatted).toFixed(4)} <span className="text-primary font-black">MAX</span></button>
                 </div>
              </div>

              {/* Relay Divider */}
              <div className="flex justify-center -my-8 relative z-10 scale-125">
                 <div className="bg-[#0a0d14] border-[6px] border-white/5 p-4 rounded-3xl text-primary shadow-[0_0_40px_rgba(251,17,142,0.2)]">
                    <ArrowRight className="w-8 h-8 rotate-90" />
                 </div>
              </div>

              {/* Destination Card */}
              <div className="bg-black/60 p-10 rounded-[40px] border border-white/5 pb-12">
                 <div className="flex justify-between items-center mb-10">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Target Constellation</span>
                    <button onClick={() => setShowChainSelector(!showChainSelector)} className="flex items-center gap-3 px-5 py-2.5 bg-white/5 text-white rounded-2xl font-black text-sm shadow-xl uppercase border border-white/10 hover:border-primary/50 transition-all">
                       <div className={`w-4 h-4 rounded-full ${destChain.color} shadow-lg`} />
                       {destChain.name}
                       <ChevronDown className="w-5 h-5 opacity-40" />
                    </button>
                 </div>

                 <div className="flex items-center justify-between">
                    <p className={`text-5xl font-black tracking-tighter ${amount ? 'text-white' : 'text-white/10'}`}>
                       {amount ? amount : "0.00"}
                    </p>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Transmit Time
                       </span>
                       <span className="text-sm font-black text-white">~ 2 MINUTES</span>
                    </div>
                 </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                 <Button 
                   size="lg" 
                   className="action-button h-24 text-3xl font-black group relative overflow-hidden"
                   onClick={handleBridge}
                   disabled={!isConnected || !amount || isPending || isConfirming}
                 >
                    <div className="relative z-10 flex items-center justify-center gap-4">
                       {isPending || isConfirming ? <Loader2 className="animate-spin w-8 h-8" /> : (
                         <>{needsApproval ? `Grant Permission` : "Initiate Asset Relay"}</>
                       )}
                    </div>
                 </Button>
              </div>
           </div>
        </div>

        {/* Transmission Telemetry */}
        <div className="mt-12 grid grid-cols-2 gap-6">
           <div className="glass-panel p-6 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-primary/10 rounded-lg text-primary"><Shield className="w-5 h-5" /></div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Protocol Secure</h4>
              </div>
              <p className="text-[11px] text-text-muted font-bold leading-relaxed">Assets are locked via audited smart contract relays with 100% reserve transparency.</p>
           </div>
           <div className="glass-panel p-6 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Cpu className="w-5 h-5" /></div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Quantum Finality</h4>
              </div>
              <p className="text-[11px] text-text-muted font-bold leading-relaxed">Kortana Relay confirms block state in &lt; 2s, providing institutional-grade settlement speed.</p>
           </div>
        </div>
      </div>

      <TxStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); reset(); }}
        title={activeStep === "approving" ? "AUTHENTICATING DEPOSIT" : "ASSET RELAY INITIALIZED"}
        status={isConfirming || isPending ? "pending" : isSuccess ? "success" : "error"}
        hash={hash || undefined}
        message={error ? (error as any).shortMessage || error.message : undefined}
      />
    </div>
  );
}
