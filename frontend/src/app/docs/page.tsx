"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  ArrowLeft, 
  Book, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Code2,
  Lock,
  Zap,
  Droplets,
  TrendingUp,
  History
} from "lucide-react";
import { CONTRACTS } from "@/lib/contracts";

export default function DocsPage() {
  const ADDRESSES = [
    { name: "Sovereign Factory", address: CONTRACTS.FACTORY, desc: "Liquidates and manifests all trading pairs." },
    { name: "Omega Router (V2)", address: CONTRACTS.ROUTER, desc: "High-speed institutional price resolver and swap executor." },
    { name: "DNR / USDC.k Pair", address: CONTRACTS.PAIR_DNR_USDC, desc: "The $2.5 Billion DNR liquidity anchor." },
    { name: "Bridged USDC (USDC.k)", address: CONTRACTS.KORTUSD, desc: "Kortana's institutional stablecoin manifest." },
    { name: "Wrapped Dinar (WDNR)", address: CONTRACTS.WDNR, desc: "Native Dinar gas asset in ERC20 format." },
    { name: "Sovereign Bridge", address: CONTRACTS.BRIDGE, desc: "Cross-chain asset relay for the Ethereum cluster." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d14] p-8 md:p-12 relative overflow-hidden">
      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-secondary/5 blur-[200px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto z-10 relative mt-20">
        <div className="flex items-center gap-4 mb-12">
           <Link href="/" className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:text-primary transition-all">
              <ArrowLeft className="w-6 h-6" />
           </Link>
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                 <Book className="w-3 h-3" /> Technical Blueprint
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase">PROTOCOL DOCUMENTATION</h1>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Sidebar Navigation */}
           <div className="lg:col-span-3 space-y-2">
              {[
                { name: "Overview", icon: Globe, active: true },
                { name: "Smart Contracts", icon: Code2 },
                { name: "Atomic Swap", icon: Zap },
                { name: "Liquidity Forge", icon: Droplets },
                { name: "Sovereign Bridge", icon: Globe },
                { name: "Economic Security", icon: ShieldCheck },
              ].map((item, i) => (
                <button 
                  key={i} 
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left font-black uppercase text-[11px] tracking-widest ${item.active ? 'bg-primary/20 border-primary/40 text-white shadow-[0_0_20px_rgba(251,17,142,0.1)]' : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                >
                   <item.icon className={`w-5 h-5 ${item.active ? 'text-primary' : 'text-text-muted/40'}`} />
                   {item.name}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="lg:col-span-9 space-y-12">
              <section className="glass-panel p-10 bg-white/[0.01]">
                 <h2 className="text-3xl font-black text-white tracking-tighter mb-6 uppercase flex items-center gap-4">
                    <Globe className="w-8 h-8 text-primary" /> Protocol Overview
                 </h2>
                 <p className="text-lg text-text-muted font-bold leading-relaxed mb-8">
                    KortanaDEX is the institutional-grade Decentralized Exchange fueling the Sovereign Dinar (DNR) economy on the Kortana Mainnet. 
                    Architected for high-performance liquidity provision and secure asset movement, the protocol utilizes an advanced AMM (Automated Market Maker) 
                    layer to ensure global parity and deep capital efficiency.
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                       <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">Liquidity Depth</h4>
                       <p className="text-sm text-text-muted font-bold">The Omega Pair (DNR/USDC.k) is seeded with over $2.5 Billion in capital, providing the deepest liquidity depth in the Kortana cluster.</p>
                    </div>
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                       <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">Price Integrity</h4>
                       <p className="text-sm text-text-muted font-bold">The Sovereign Router utilizes a high-speed monolithic resolver to bypass RPC latency and deliver instantaneous price quotes.</p>
                    </div>
                 </div>
              </section>

              <section className="glass-panel p-10 bg-white/[0.01]">
                 <h2 className="text-3xl font-black text-white tracking-tighter mb-8 uppercase flex items-center gap-4">
                    <Code2 className="w-8 h-8 text-secondary" /> Smart Contract Registry
                 </h2>
                 <div className="space-y-4">
                    {ADDRESSES.map((item, i) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-black/40 rounded-[32px] border border-white/5 group hover:border-primary/30 transition-all">
                         <div>
                            <h4 className="text-lg font-black text-white tracking-tighter uppercase mb-1">{item.name}</h4>
                            <p className="text-xs text-text-muted font-bold">{item.desc}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <code className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-primary text-xs font-black tabular-nums group-hover:bg-primary/10 transition-all">
                               {item.address.slice(0, 10)}...{item.address.slice(-8)}
                            </code>
                            <button 
                              onClick={() => window.open(`https://explorer.kortana.xyz/address/${item.address}`, "_blank")}
                              className="p-3 bg-white/5 rounded-xl border border-white/10 hover:text-primary transition-all"
                            >
                               <ExternalLink className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="glass-panel p-10 bg-white/[0.01]">
                 <h2 className="text-3xl font-black text-white tracking-tighter mb-6 uppercase flex items-center gap-4">
                    <Zap className="w-8 h-8 text-yellow-500" /> Atomic Swap Mechanism
                 </h2>
                 <p className="text-lg text-text-muted font-bold leading-relaxed mb-6">
                    Swaps on KortanaDEX are atomic and decentralized. The protocol settles trades using the standard Constant Product formula (x * y = k), 
                    optimized for the high-throughput Kortana Mainnet environment.
                 </p>
                 <div className="space-y-4">
                    <div className="flex items-start gap-6 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary"><TrendingUp className="w-6 h-6" /></div>
                        <div>
                           <h5 className="font-black text-white uppercase text-[11px] tracking-widest mb-1">Price Oracle Redundancy</h5>
                           <p className="text-sm text-text-muted font-bold">Router V2 integrates localized reserve querying to eliminate dependency on unstable external price feeds during peak volume.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-6 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="p-3 bg-secondary/10 rounded-xl text-secondary"><Layers className="w-6 h-6" /></div>
                        <div>
                           <h5 className="font-black text-white uppercase text-[11px] tracking-widest mb-1">Multi-Hop Routing</h5>
                           <p className="text-sm text-text-muted font-bold">Trade any asset manifest on the Kortana cluster. The factory-router bridge automatically calculates the most capital-efficient path.</p>
                        </div>
                    </div>
                 </div>
              </section>

              <div className="flex justify-between items-center py-12 border-t border-white/5 mt-20">
                 <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em]">KortanaDEX Architecture • 2026</div>
                 <div className="flex gap-4">
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-all">Support Terminal</button>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-all">Report Vulnerability</button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
