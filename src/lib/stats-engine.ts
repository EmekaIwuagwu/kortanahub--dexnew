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
  ZEUS_RPC: "https://zeus-rpc.mainnet.kortana.xyz",
  GENESIS_BLOCK: 4502000,
  TX_MULTI: 142.5
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

  const instruments = [
    {
      symbol: "DNR_USDCk",
      base_asset: "DNR",
      quote_asset: "USDCk",
      base_id: CONTRACTS.WDNR,
      quote_id: CONTRACTS.KORTUSD,
      price_precision: 4,
      qty_precision: 2
    }
  ];

  const blockNumber = await provider.getBlockNumber();
  const totalBlocks = blockNumber;
  const totalTransactions = Math.floor(blockNumber * STATS_CONFIG.TX_MULTI);

  return {
    ...calculateSyntheticMetrics(livePrice, botVolumeNum),
    rUSDC,
    rDNR,
    livePrice,
    instruments,
    networkStats: {
      totalBlocks,
      totalTransactions
    }
  };
}

export async function getRecentTrades(limit = 50) {
  const provider = new ethers.JsonRpcProvider(STATS_CONFIG.ZEUS_RPC);
  const pair = new ethers.Contract(CONTRACTS.PAIR_DNR_USDC, [
    "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"
  ], provider);

  const filter = pair.filters.Swap();
  const logs = await pair.queryFilter(filter, -1000, "latest"); // Last 1000 blocks

  // Sort and slice to get latest trades
  return logs.slice(-limit).reverse().map(log => {
      const { amount0In, amount1In, amount0Out, amount1Out } = (log as any).args;
      const isBuy = amount0Out > 0n; // Simple buy/sell logic assuming token0 is the quote
      return {
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          isBuy,
          amount: isBuy ? amount0Out.toString() : amount0In.toString(),
          timestamp: Date.now() // Ideally fetch from block, but let's keep it light for now
      };
  });
}

export async function getOrderBook() {
  const { rUSDC, rDNR, livePrice } = await getLiveStats();
  
  // Synthesize depth tiers based on price impact
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];
  
  const tiers = [0.005, 0.01, 0.02, 0.05]; // 0.5%, 1%, 2%, 5% depth
  
  tiers.forEach(impact => {
      const bidPrice = (livePrice * (1 - impact)).toFixed(4);
      const askPrice = (livePrice * (1 + impact)).toFixed(4);
      const depthUSD = (3500 + Math.random() * 2000) * STATS_CONFIG.DEPTH_MULTI / 100; // Scaled depth
      
      bids.push([bidPrice, (depthUSD / parseFloat(bidPrice)).toFixed(2)]);
      asks.push([askPrice, (depthUSD / parseFloat(askPrice)).toFixed(2)]);
  });

  return {
      timestamp: Date.now(),
      bids: bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])),
      asks: asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  };
}
