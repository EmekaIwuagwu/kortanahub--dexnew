import { ethers } from 'ethers';
import { CONTRACTS } from './contracts';

export const STATS_CONFIG = {
  GENESIS_TIME: 1776528000000, // April 18 Genesis
  DEPTH_MULTI: 150000,
  VOLUME_PREMIUM_RATIO: 1.25,
  BASE_HOURLY_VOLUME: 7000,
  MAX_HOURLY_VARIANCE: 15000,
  INITIAL_DYNAMIC_BASE: 830700,
  BOT_VOLUME_BASELINE: 107661.74,
  TOTAL_SUPPLY: 10000000000,
  ZEUS_RPC: "https://zeus-rpc.mainnet.kortana.xyz"
};

export function calculateVolumeMetrics() {
  const hoursPassed = Math.floor((Date.now() - STATS_CONFIG.GENESIS_TIME) / (1000 * 60 * 60));
  
  let accumulatedGrowth = 0;
  for (let i = 0; i <= hoursPassed; i++) {
    const seed = Math.abs(Math.sin(i + 42) * 10000);
    const hourlyVariance = (seed % 1) * STATS_CONFIG.MAX_HOURLY_VARIANCE;
    accumulatedGrowth += STATS_CONFIG.BASE_HOURLY_VOLUME + hourlyVariance;
  }
  
  const dynamicBase = STATS_CONFIG.INITIAL_DYNAMIC_BASE + accumulatedGrowth;
  return { dynamicBase, hoursPassed };
}

export function calculateSyntheticMetrics(livePrice: number, botVolume: number = STATS_CONFIG.BOT_VOLUME_BASELINE) {
  const { dynamicBase } = calculateVolumeMetrics();
  const finalVolume = dynamicBase + botVolume;
  const volumePremium = (finalVolume / 1000000) * STATS_CONFIG.VOLUME_PREMIUM_RATIO;
  const syntheticPrice = livePrice + volumePremium;
  
  return {
    finalVolume,
    volumePremium,
    syntheticPrice,
    fdv: syntheticPrice * STATS_CONFIG.TOTAL_SUPPLY
  };
}

export function getSupplyMetrics() {
  // We can refine this logic to subtract locked wallet balances later
  const total = STATS_CONFIG.TOTAL_SUPPLY;
  const circulating = total; // Default to full circulation for now unless you have locked addresses
  
  return {
    total,
    circulating
  };
}

export async function getLiveStats() {
  const provider = new ethers.JsonRpcProvider(STATS_CONFIG.ZEUS_RPC);
  const pair = new ethers.Contract(CONTRACTS.PAIR_DNR_USDC, [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)"
  ], provider);

  const [r0, r1] = await pair.getReserves();
  const t0 = await pair.token0();

  const isT0USDC = t0.toLowerCase() === CONTRACTS.KORTUSD.toLowerCase();
  const rUSDC = isT0USDC ? r0 : r1;
  const rDNR = isT0USDC ? r1 : r0;

  const livePrice = Number(rUSDC) / Number(rDNR);

  let botVolumeNum = STATS_CONFIG.BOT_VOLUME_BASELINE;
  try {
    const volRes = await fetch("https://kortanahub-bot.onrender.com/stats", { next: { revalidate: 30 } });
    const volData = await volRes.json();
    if (volData && volData.usd_volume) {
      botVolumeNum = volData.usd_volume;
    }
  } catch (e) { /* use baseline */ }

  return {
    ...calculateSyntheticMetrics(livePrice, botVolumeNum),
    rUSDC,
    rDNR,
    livePrice
  };
}
