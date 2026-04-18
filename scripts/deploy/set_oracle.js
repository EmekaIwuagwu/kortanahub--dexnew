const { ethers } = require("hardhat");

async function main() {
  const oracleAddr = "0x59D020682c387d295a4414DF766ff0c3B3Cf3BfB";
  
  // $215.92 in 18 decimals
  const dnrPrice = ethers.parseUnits("215.92", 18);
  const kusdPrice = ethers.parseUnits("1.00", 18);

  console.log(`🚀 ANCHORING GLOBAL ORACLE TO $215.92...`);
  
  const oracle = await ethers.getContractAt([
    "function setManualPrices(uint256 dnrPrice, uint256 kusdPrice) external"
  ], oracleAddr);

  const tx = await oracle.setManualPrices(dnrPrice, kusdPrice, { type: 0 });
  console.log("⏳ Waiting for global price propagation...");
  await tx.wait();
  
  console.log("✅ ORACLE ANCHORED AT $215.92.");
}

main().catch(console.error);
