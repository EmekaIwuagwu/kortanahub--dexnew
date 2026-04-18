import { NextResponse } from 'next/server';

export async function GET() {
  const DNR_PRICE = 215.92;
  return NextResponse.json({
    "DNR_USDCk": {
      "base_id": "0xABa74d3376984817d8739E3Ec2B99d3b6Ed8E481", // WDNR
      "target_id": "0x661BE53c9f5B77C075c0F9E0680260285846F9CA", // USDC.k
      "last_price": DNR_PRICE.toString(),
      "base_volume": "2700.44",
      "target_volume": (2700.44 * DNR_PRICE).toFixed(2),
      "bid": (DNR_PRICE * 0.999).toFixed(4),
      "ask": (DNR_PRICE * 1.001).toFixed(4),
      "high": (DNR_PRICE * 1.02).toFixed(4),
      "low": (DNR_PRICE * 0.98).toFixed(4)
    }
  });
}
