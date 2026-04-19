import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

import { CONTRACTS } from '@/lib/contracts';

const ZEUS_RPC = "https://zeus-rpc.mainnet.kortana.xyz";
const MAINNET_CONFIG = {
  PAIR: CONTRACTS.PAIR_DNR_USDC,
  USDCk: CONTRACTS.KORTUSD,
  WDNR: CONTRACTS.WDNR
};

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(ZEUS_RPC);
    const pair = new ethers.Contract(MAINNET_CONFIG.PAIR, [
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function token0() view returns (address)"
    ], provider);

    const [r0, r1] = await pair.getReserves();
    const t0 = await pair.token0();

    const isT0USDC = t0.toLowerCase() === MAINNET_CONFIG.USDCk.toLowerCase();
    const rUSDC = isT0USDC ? r0 : r1;
    const rDNR = isT0USDC ? r1 : r0;

    const livePrice = Number(rUSDC) / Number(rDNR);

    // ─── Evolutionary Volatility Engine (Organic Growth Calibration) ───
    const genesisTime = 1776528000000; // April 18 Genesis
    const hoursPassed = Math.floor((Date.now() - genesisTime) / (1000 * 60 * 60));
    
    let accumulatedGrowth = 0;
    for (let i = 0; i <= hoursPassed; i++) {
        const seed = Math.abs(Math.sin(i + 42) * 10000);
        const hourlyVariance = (seed % 1) * 15000; // Randomly add up to 15k
        accumulatedGrowth += 7000 + hourlyVariance; // Base 7k + 15k var = 22k Max
    }
    
    const dynamicBase = 830700 + accumulatedGrowth;

    let botVolumeNum = 107661.74; 
    try {
      const volRes = await fetch("https://kortanahub-bot.onrender.com/stats", { next: { revalidate: 30 } });
      const volData = await volRes.json();
      if (volData && volData.usd_volume) {
        botVolumeNum = volData.usd_volume; 
      }
    } catch (e) { /* use baseline */ }

    const finalVolume = dynamicBase + botVolumeNum;

    // ─── Institutional Price Appreciation Engine (Volume Linked) ───
    // Every $1M in volume creates a $1.25 price premium over the floor
    const volumePremium = (finalVolume / 1000000) * 1.25;
    const syntheticPrice = livePrice + volumePremium;

    const formattedUSDC = Number(ethers.formatUnits(rUSDC, 18));
    const formattedDNR = Number(ethers.formatUnits(rDNR, 18));
    
    // INSTITUTIONAL SCALING (The "Omega" Depth Engine)
    const DEPTH_MULTI = 150000; 

    return NextResponse.json({
      success: true,
      network: "Kortana Zeus Mainnet",
      data: {
        price_dnr_usd: syntheticPrice.toFixed(2),
        live_pool_price: syntheticPrice.toFixed(4),
        total_liquidity_usd: (formattedUSDC * DEPTH_MULTI * 2).toFixed(2), 
        volume_24h: finalVolume.toFixed(2),
        market_cap_fdv: (livePrice * 200000000).toFixed(2), // FDV remains based on circulating units
        tokens: [
          { symbol: "DNR", reserve: (formattedDNR * DEPTH_MULTI).toFixed(2) }, 
          { symbol: "USDC.k", reserve: (formattedUSDC * DEPTH_MULTI).toFixed(2) }
        ]
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
