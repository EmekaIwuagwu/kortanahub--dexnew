import { NextResponse } from 'next/server';

export async function GET() {
  const DNR_PRICE = 215.92;
  return NextResponse.json([{
    "trading_pairs": "DNR_USDCk",
    "base_currency": "DNR",
    "target_currency": "USDC.k",
    "last_price": DNR_PRICE.toString(),
    "lowest_ask": (DNR_PRICE * 1.001).toFixed(4),
    "highest_bid": (DNR_PRICE * 0.999).toFixed(4),
    "base_volume": "2700.44",
    "target_volume": (2700.44 * DNR_PRICE).toFixed(2),
    "price_change_24h": "4.22",
    "highest_price_24h": (DNR_PRICE * 1.05).toFixed(4),
    "lowest_price_24h": (DNR_PRICE * 0.95).toFixed(4)
  }]);
}
