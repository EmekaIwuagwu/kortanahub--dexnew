"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  ArrowLeftRight, 
  Droplets, 
  Network, 
  LogOut,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  Book,
  Sparkles
} from "lucide-react";
import { clsx } from "clsx";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";

const NAV_ITEMS = [
  { name: "Swap", href: "/swap", icon: ArrowLeftRight },
  { name: "Pools", href: "/liquidity", icon: Droplets },
  { name: "Bridge", href: "/bridge", icon: Network },
  { name: "Docs", href: "/docs", icon: Book },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected) {
      console.log("🛠️ SOVEREIGN TELEMETRY: Current Chain ID manifested:", chainId);
    }
  }, [mounted, isConnected, chainId]);

  const isWrongNetwork = mounted && isConnected && chainId !== 9002 && chainId !== 7251;

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-background/60 backdrop-blur-xl border-b border-white/[0.05] z-[100] px-8 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 duration-300">
          <img 
            src="/logo_lion_clean.png" 
            alt="Kortana Logo" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="font-black text-2xl tracking-tighter text-white uppercase">KortanaDEX</h1>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-5 py-2 rounded-full text-[13px] font-black tracking-widest uppercase transition-all duration-200",
                  isActive 
                    ? "text-white bg-white/10" 
                    : "text-text-muted hover:text-white"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {mounted && isWrongNetwork ? (
          <button 
            onClick={() => switchChain?.({ chainId: 9002 })}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase animate-pulse hover:bg-red-500 hover:text-white transition-all tracking-widest"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Switch to Kortana Mainnet</span>
            </div>
          </button>
        ) : mounted && isConnected ? (
          <div className="hidden md:flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl bg-white/5 border border-white/[0.05] hover:bg-white/10 transition-all cursor-default">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(251,17,142,1)] animate-pulse" />
              <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Kortana Mainnet</span>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <ConnectButton 
            accountStatus="avatar" 
            showBalance={false}
            chainStatus="none"
          />
          {mounted && isConnected && (
            <button 
              onClick={() => disconnect()}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/[0.05] hover:bg-red-500/10 hover:border-red-500/20 text-text-muted hover:text-red-500 transition-all group"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-text-muted hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-background z-[200] lg:hidden p-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-6 text-3xl font-black uppercase tracking-tighter"
              >
                <item.icon className="w-8 h-8 text-primary" /> {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
