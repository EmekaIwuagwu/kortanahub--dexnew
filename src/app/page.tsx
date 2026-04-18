import React from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  ArrowRight, 
  Activity, 
  Droplets, 
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Lock,
  Boxes,
  Layers,
  Sparkles,
  TrendingUp,
  Coins,
  ArrowUpRight,
  MousePointer2
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0d14]">
      {/* ─── Cinematic Background Layer ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-secondary/10 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50 mix-blend-overlay" />
      </div>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-48 pb-60 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] backdrop-blur-md px-6 py-2.5 rounded-full mb-12 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Kortana Mainnet Secured</span>
          </div>
          
          <img 
            src="/logo_lion_clean.png" 
            alt="Kortana Lion" 
            className="w-48 h-48 mb-12 drop-shadow-[0_0_40px_rgba(251,17,142,0.3)] animate-in zoom-in duration-1000"
          />

          <h1 className="text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[0.9] text-white animate-in fade-in slide-in-from-bottom-8 duration-1000">
            THE Hub OF THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#FF4EAC]">DINAR ECONOMY</span>
          </h1>
          
          <p className="text-text-muted/80 text-2xl mb-14 max-w-3xl leading-relaxed font-bold animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            A Regal Decentralized Exchange manifest on the Kortana Mainnet. 
            Experience high-performance Liquidity, Stability, and Growth.
          </p>

          <div className="flex items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <Link href="/swap">
              <Button size="lg" className="h-20 px-16 text-2xl font-black gap-4 rounded-[32px] action-button">
                Get Started <ArrowRight className="w-7 h-7" />
              </Button>
            </Link>
            <Link href="/liquidity">
              <button className="h-20 px-16 text-2xl font-black bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] rounded-[32px] text-white transition-all backdrop-blur-xl">
                Explore Hub
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Institutional Metrics ─── */}
      <section className="py-20 z-10 relative">
         <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: "Total Liquidity Locked", value: "$2,591,018,193", icon: Droplets, color: "text-primary" },
                  { label: "24H Trading Volume", value: "$12,840,490", icon: Zap, color: "text-secondary" },
                  { label: "Network Authority", value: "Kortana Mainnet", icon: ShieldCheck, color: "text-white" },
                ].map((stat, i) => (
                  <div key={i} className="glass-panel p-8 group hover:border-primary/50 transition-all duration-500">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform shadow-xl`}>
                           <stat.icon className="w-8 h-8" />
                        </div>
                        <ArrowUpRight className="w-6 h-6 text-text-muted/40 group-hover:text-primary transition-colors" />
                     </div>
                     <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                     <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                  </div>
                ))}
            </div>
         </div>
      </section>

      {/* ─── Feature Ecosystem ─── */}
      <section className="py-40 z-10 relative bg-black/20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-24">
            <div className="max-w-2xl">
              <h2 className="text-6xl font-black mb-6 tracking-tighter text-white uppercase">The Enclave Suite</h2>
              <p className="text-xl text-text-muted font-bold leading-relaxed">
                Institutional-grade DeFi tools architected for the next generation of institutional liquidity providers and traders.
              </p>
            </div>
            <Link href="/docs" className="text-primary font-black flex items-center gap-2 group mb-2 text-lg">
               System Blueprint <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Atomic Swap",
                desc: "High-precision AMM optimized for sovereign Dinar (DNR) liquidity depth.",
                icon: TrendingUp,
                link: "/swap",
                tag: "CORE"
              },
              {
                title: "Liquidity Forge",
                desc: "Seed the ecosystem and earn 0.3% across the network's most vital trading routes.",
                icon: Droplets,
                link: "/liquidity",
                tag: "YIELD"
              },
              {
                title: "Rewards Pool",
                desc: "Secure the network and claim governance authority through protocol incentives.",
                icon: Activity,
                link: "/farm",
                tag: "DAO"
              },
              {
                title: "Sovereign Bridge",
                desc: "Interstellar asset relay connecting Kortana to the wider Ethereum cluster.",
                icon: Globe,
                link: "/bridge",
                tag: "RELAY"
              },
              {
                title: "Asset Stabilizer",
                desc: "The algorithmic anchor of the ecosystem. Managed institutional stability terminal.",
                icon: ShieldCheck,
                link: "/stabilizer",
                tag: "STABLE"
              }
            ].map((f, i) => (
              <Link href={f.link} key={i}>
                <div className="group h-full p-10 bg-white/[0.01] border border-white/[0.06] rounded-[40px] hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-500 hover:translate-y-[-8px]">
                  <div className="flex justify-between items-start mb-16">
                    <div className="p-5 rounded-[24px] bg-white/[0.04] text-primary group-hover:shadow-[0_0_30px_rgba(251,17,142,0.2)] transition-all">
                      <f.icon className="w-10 h-10" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted group-hover:text-primary transition-colors">{f.tag}</span>
                  </div>
                  <h3 className="text-3xl font-black mb-4 text-white tracking-tight">{f.title}</h3>
                  <p className="text-text-muted text-lg font-bold leading-relaxed">{f.desc}</p>
                  
                  <div className="mt-12 flex items-center gap-2 text-white/20 group-hover:text-primary transition-colors font-black uppercase text-[10px] tracking-[0.2em]">
                     Initialize Module <MousePointer2 className="w-4 h-4 translate-y-[-1px]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dinar Asset Section ─── */}
      <section className="py-60 z-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="animate-in slide-in-from-left-20 duration-1000">
            <div className="inline-flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.6em] mb-10">
              <Coins className="w-5 h-5" /> SOVEREIGN ASSET
            </div>
            <h2 className="text-8xl font-black mb-12 tracking-tighter text-white leading-[0.9]">SOVEREIGN DINAR (DNR)</h2>
            <p className="text-text-muted/80 text-2xl mb-12 leading-relaxed font-bold">
              The heartbeat of the Kortana cluster. DNR powers every transaction, 
              secures every validator, and anchors the stability of the institutional economy.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Network Gas", desc: "DNR fuels all protocol interactions." },
                { title: "USDC.k Parity", desc: "The foundation of the stable economy." },
                { title: "DAO Weight", desc: "Participate in institutional governance." },
                { title: "Deep Liquidity", desc: "Always tradable, always liquid." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.05] hover:border-primary/20 transition-all">
                  <h4 className="font-black text-white mb-2 uppercase text-xs tracking-widest">{item.title}</h4>
                  <p className="text-sm text-text-muted font-bold tracking-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-in slide-in-from-right-20 duration-1000">
             <div className="aspect-square glass-panel p-2 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 opacity-30 group-hover:opacity-60 transition-opacity" />
                <div className="relative z-10 text-center">
                   <img 
                    src="/logo.png" 
                    alt="DNR Sovereign" 
                    className="w-[280px] h-[280px] mx-auto mb-10 drop-shadow-[0_0_80px_rgba(251,17,142,0.4)] animate-bounce duration-[8000ms] object-contain"
                   />
                   <h3 className="text-6xl font-black text-white tracking-tighter uppercase">Dinar Asset</h3>
                   <p className="text-secondary font-black uppercase text-xs tracking-[1em] mt-4 ml-4">GENESIS ACTIVE</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── Join Section ─── */}
      <section className="py-60 z-10 relative">
        <div className="max-w-6xl mx-auto px-8">
           <div className="glass-panel py-32 px-12 text-center relative overflow-hidden border-primary/20 bg-primary/[0.02]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
              <h2 className="text-8xl font-black mb-10 tracking-tighter text-white uppercase">Join the Kortana Cluster</h2>
              <p className="text-text-muted/90 text-2xl mb-16 font-bold max-w-3xl mx-auto leading-relaxed">
                Connect your institutional wallet to the Kortana Mainnet and join thousands of participants 
                shaping the future of decentralized high-finance.
              </p>
              <div className="flex justify-center gap-8">
                 <Link href="/swap">
                   <Button size="lg" className="h-24 px-24 text-3xl font-black rounded-[40px] action-button">Launch KortanaDEX</Button>
                 </Link>
              </div>
              <div className="mt-20 flex justify-center items-center gap-12 text-text-muted/40 font-black uppercase text-[10px] tracking-[0.5em]">
                 <span>KORTANA MAINNET</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-border" />
                 <span>2.5B TVL MAPPED</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-border" />
                 <span>AUDIT 100% LOCKED</span>
              </div>
           </div>
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="py-24 z-10 relative bg-black/40 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center">
           <img 
              src="/logo_lion_clean.png" 
              alt="Logo" 
              className="w-16 h-16 mb-8 grayscale opacity-50 contrast-125 transition-all hover:grayscale-0 hover:opacity-100"
           />
           <div className="flex gap-12 mb-12">
              <Link href="/swap" className="text-text-muted hover:text-primary transition-colors font-black uppercase text-xs tracking-widest">Protocol</Link>
              <Link href="/liquidity" className="text-text-muted hover:text-primary transition-colors font-black uppercase text-xs tracking-widest">Ecosystem</Link>
              <Link href="/farm" className="text-text-muted hover:text-primary transition-colors font-black uppercase text-xs tracking-widest">Governance</Link>
              <Link href="/bridge" className="text-text-muted hover:text-primary transition-colors font-black uppercase text-xs tracking-widest">Terminal</Link>
           </div>
           <p className="text-text-muted/30 font-black uppercase text-[10px] tracking-[0.4em]">
              © 2026 Kortana Ecosystem Architects. Manifested on Kortana.
           </p>
        </div>
      </footer>
    </div>
  );
}
