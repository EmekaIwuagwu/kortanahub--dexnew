"use client";

import React from "react";
import { X, Info, Settings2, ShieldCheck, Zap } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  setSlippage: (val: number) => void;
  deadline: number;
  setDeadline: (val: number) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  slippage, 
  setSlippage, 
  deadline, 
  setDeadline 
}: SettingsModalProps) {
  if (!isOpen) return null;

  const slippageOptions = [0.1, 0.5, 1.0];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px] bg-[#0d1117] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl">
                <Settings2 className="w-5 h-5 text-primary" />
             </div>
             <h3 className="text-lg font-black uppercase tracking-tight text-white">Engine Settings</h3>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-white transition-colors bg-white/5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Slippage Tolerance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 group">
                <span className="text-xs font-black text-text-muted uppercase tracking-widest">Slippage Tolerance</span>
                <div className="relative">
                   <Info className="w-3.5 h-3.5 text-text-muted cursor-help" />
                   <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      Your transaction will revert if the price changes unfavorably by more than this percentage.
                   </div>
                </div>
              </div>
              <span className={`text-xs font-bold ${slippage > 1 ? 'text-yellow-500' : 'text-primary'}`}>
                {slippage}%
              </span>
            </div>

            <div className="flex gap-2">
              {slippageOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSlippage(opt)}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border ${
                    slippage === opt 
                      ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(251,17,142,0.3)]' 
                      : 'bg-white/5 text-text-muted border-white/10 hover:border-white/20'
                  }`}
                >
                  {opt}%
                </button>
              ))}
              <div className="flex-[1.5] relative">
                <input 
                  type="number"
                  placeholder="Custom"
                  value={slippageOptions.includes(slippage) ? "" : slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  className={`w-full h-full bg-white/5 border rounded-2xl px-4 text-xs font-black outline-none transition-all ${
                    !slippageOptions.includes(slippage) 
                      ? 'border-primary text-white' 
                      : 'border-white/10 focus:border-primary/50'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">%</span>
              </div>
            </div>
            {slippage > 3 && (
                <p className="text-[10px] font-bold text-yellow-500 flex items-center gap-1.5 px-1 uppercase tracking-tighter">
                   <ShieldCheck className="w-3 h-3" /> Warning: High slippage may result in sandwich attacks.
                </p>
            )}
          </div>

          {/* Transaction Deadline */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-xs font-black text-text-muted uppercase tracking-widest">Transaction Deadline</span>
                <span className="text-xs font-bold text-white">{deadline} Minutes</span>
             </div>
             <div className="relative">
                <input 
                  type="number"
                  value={deadline}
                  onChange={(e) => setDeadline(parseInt(e.target.value) || 1)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:border-primary/50 transition-all text-white"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase">Min</span>
             </div>
          </div>
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/10">
           <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
              <Zap className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Aggregator Mode</p>
                 <p className="text-[10px] text-white/50 leading-relaxed font-medium">Your trade is optimized through the Atomic Router for minimal gas consumption and maximum extraction value.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
