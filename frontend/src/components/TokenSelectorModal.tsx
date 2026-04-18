"use client";

import React, { useState } from "react";
import { X, Search, Globe, Plus, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_TOKENS } from "@/lib/contracts";
import { useTokenMetadata } from "@/hooks/useTokenMetadata";
import { isAddress } from "viem";

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: any) => void;
}

export function TokenSelectorModal({ isOpen, onClose, onSelect }: TokenSelectorModalProps) {
  const [search, setSearch] = useState("");
  
  const isSearchAddress = isAddress(search);
  const { symbol, name, decimals, isLoading } = useTokenMetadata(isSearchAddress ? (search as `0x${string}`) : undefined);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[420px] bg-[#131A2A] border border-border rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-bold">Select a token</h3>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input 
              type="text"
              placeholder="Search name or paste address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#191B1F] border border-border rounded-[20px] pl-12 pr-6 py-4 outline-none focus:border-primary transition-all font-medium"
            />
          </div>

          {/* Common Tokens Tags */}
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TOKENS.map(token => (
              <button 
                key={token.address}
                onClick={() => { onSelect(token); onClose(); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-[#1C2438]/50 hover:bg-[#1C2438] transition-all"
              >
                {token.logo ? (
                  <img src={token.logo} className="w-5 h-5 rounded-full object-contain" alt={token.symbol} />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-white">
                    {token.symbol[0]}
                  </div>
                )}
                <span className="text-sm font-bold">{token.symbol}</span>
              </button>
            ))}
          </div>

          {/* List Area */}
          <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
            {isSearchAddress ? (
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                     <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : symbol ? (
                  <button 
                    onClick={() => { 
                        onSelect({ symbol, name, address: search, decimals }); 
                        onClose(); 
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-[20px] hover:bg-[#1C2438] transition-all group border border-primary/20 bg-primary/5"
                  >
                    <div className="flex items-center gap-4 text-left">
                       <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-white">
                         {symbol[0]}
                       </div>
                       <div>
                         <p className="font-bold">{symbol}</p>
                         <p className="text-xs text-text-muted">{name}</p>
                       </div>
                    </div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">
                       Import Found Token
                    </div>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                    <AlertCircle className="w-10 h-10 mb-4" />
                    <p className="text-sm font-medium">No token found at this address</p>
                  </div>
                )}
              </div>
            ) : (
                <div className="py-2">
                    <p className="px-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Default Tokens</p>
                    {DEFAULT_TOKENS.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())).map(token => (
                        <button 
                            key={token.address}
                            onClick={() => { onSelect(token); onClose(); }}
                            className="w-full flex items-center gap-4 p-4 rounded-[20px] hover:bg-[#1C2438] transition-all group"
                        >
                            {token.logo ? (
                              <img src={token.logo} className="w-10 h-10 rounded-full object-contain" alt={token.symbol} />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#1C2438] group-hover:bg-[#2D384D] flex items-center justify-center font-bold text-sm text-white border border-border group-hover:border-primary/20">
                                  {token.symbol[0]}
                              </div>
                            )}
                            <div className="text-left">
                                <p className="font-bold">{token.symbol}</p>
                                <p className="text-xs text-text-muted font-medium">{token.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-[#1C2438]/20 border-t border-border mt-auto">
           <div className="flex items-center gap-3 text-xs text-text-muted font-medium ">
             <Globe className="w-4 h-4" /> Community-defined tokens are not verified by Kortana.
           </div>
        </div>
      </div>
    </div>
  );
}
