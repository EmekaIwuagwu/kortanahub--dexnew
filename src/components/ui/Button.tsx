import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({ 
  variant = "primary", 
  size = "md", 
  children, 
  className, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-primary text-white shadow-[0_4px_20px_rgba(251,17,142,0.2)] hover:shadow-[0_4px_30px_rgba(251,17,142,0.4)] hover:brightness-110",
    secondary: "bg-secondary text-black shadow-lg hover:shadow-secondary/20 hover:brightness-110",
    outline: "bg-transparent border border-border hover:bg-white/5 text-white",
    ghost: "bg-transparent hover:bg-white/5 text-text-muted hover:text-white border-transparent",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button 
      className={cn(
        "rounded-[16px] font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
