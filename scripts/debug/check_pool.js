const { ethers } = require("hardhat");

async function main() {
  const pairAddr = "0x3548c5486B06c8D83935Cb57b03c1b7CEBfEe32E"; // New Foundation Pair
  console.log(`🔍 AUDITING NEW FOUNDATION MARKET: ${pairAddr}`);

  const pair = await ethers.getContractAt([
    "function getReserves() view returns (uint112, uint112, uint32)",
    "function token0() view returns (address)"
  ], pairAddr);

  try {
    const reserves = await pair.getReserves();
    const t0 = await pair.token0();
    
    const r0 = Number(ethers.formatUnits(reserves[0], 18));
    const r1 = Number(ethers.formatUnits(reserves[1], 18));
    
    console.log(`- Reserve0: ${r0}`);
    console.log(`- Reserve1: ${r1}`);

    if (r0 > 0) {
        const price = r1 / r0;
        console.log(`\n💎 SUCCESS! 1 DNR = $${price.toFixed(4)} USDC.k`);
    } else {
        console.log("\n⚠️ POOL IS STILL EMPTY.");
    }
  } catch (err) {
    console.error("❌ Probing failed.");
  }
}

main().catch(console.error);
