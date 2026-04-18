"use client";

import React from "react";
import { X, ExternalLink, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TxStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  status: "pending" | "success" | "error";
  hash?: string;
  message?: string;
}

export function TxStatusModal({ isOpen, onClose, title, status, hash, message }: TxStatusModalProps) {
  if (!isOpen) return null;

  const explorerUrl = hash ? `https://zeus-explorer.mainnet.kortana.xyz/tx/${hash}` : null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={status !== "pending" ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px] bg-[#131A2A] border border-border rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
        {status !== "pending" && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="mb-8 flex justify-center">
          {status === "pending" && (
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div className="absolute inset-0 animate-pulse rounded-full shadow-[0_0_40px_rgba(251,17,142,0.2)]" />
            </div>
          )}
          {status === "success" && (
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          )}
          {status === "error" && (
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-text-muted font-medium mb-8 leading-relaxed">
          {status === "pending" ? "Your transaction is being processed on the Kortana Zeus Mainnet. Please wait a moment." : message}
          {status === "success" && "Your transaction has been confirmed successfully."}
        </p>

        {explorerUrl && (
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-8"
          >
            View on Explorer <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {status !== "pending" && (
          <Button className="w-full h-14 font-bold rounded-2xl" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
