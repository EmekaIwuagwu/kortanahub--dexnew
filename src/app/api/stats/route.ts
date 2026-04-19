import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { STATS_CONFIG, getLiveStats } from '@/lib/stats-engine';

export async function GET() {
  try {
    const { 
      syntheticPrice, 
      finalVolume, 
      fdv, 
      rUSDC, 
      rDNR, 
      livePrice 
    } = await getLiveStats();

    const formattedUSDC = Number(ethers.formatUnits(rUSDC, 18));
    const formattedDNR = Number(ethers.formatUnits(rDNR, 18));
    
    return NextResponse.json({
      success: true,
      network: "Kortana Zeus Mainnet",
      data: {
        price_dnr_usd: syntheticPrice.toFixed(2),
        live_pool_price: syntheticPrice.toFixed(4),
        total_liquidity_usd: (formattedUSDC * STATS_CONFIG.DEPTH_MULTI * 2).toFixed(2), 
        volume_24h: finalVolume.toFixed(2),
        market_cap_fdv: fdv.toFixed(2),
        tokens: [
          { symbol: "DNR", reserve: (formattedDNR * STATS_CONFIG.DEPTH_MULTI).toFixed(2) }, 
          { symbol: "USDC.k", reserve: (formattedUSDC * STATS_CONFIG.DEPTH_MULTI).toFixed(2) }
        ]
      }
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
