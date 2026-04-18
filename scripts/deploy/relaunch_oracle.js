const { ethers } = require("hardhat");

async function main() {
  const stabilizerAddr = "0x180d6087D4fE06B2c16B2e79a0671156A0a25ba7";
  const pairAddr = "0x3548c5486B06c8D83935Cb57b03c1b7CEBfEe32E"; // New foundation pair

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 DEPLOYING INSTITUTIONAL ORACLE...`);

  // 1. Deploy Oracle
  const Oracle = await ethers.getContractFactory("KortanaOracle");
  const oracle = await Oracle.deploy(pairAddr);
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log(`✅ New Oracle: ${oracleAddr}`);

  // 2. Set Price
  console.log("Step 1: Anchoring $215.92 Price...");
  const dnrPrice = ethers.parseUnits("215.92", 18);
  const kusdPrice = ethers.parseUnits("1.00", 18);
  await oracle.setManualPrices(dnrPrice, kusdPrice);
  console.log("✅ Price Anchored.");

  // 3. Link to Stabilizer
  console.log("Step 2: Linking Stabilizer to New Oracle...");
  const stabilizer = await ethers.getContractAt([
      "function setOracle(address) external",
      "function owner() view returns (address)"
  ], stabilizerAddr);

  // Check if we own the stabilizer
  const stabOwner = await stabilizer.owner();
  console.log(`Stabilizer Owner: ${stabOwner}`);

  if (stabOwner.toLowerCase() === deployer.address.toLowerCase()) {
      const tx = await stabilizer.setOracle(oracleAddr);
      await tx.wait();
      console.log("✅ Stabilizer Updated to Institutional Oracle.");
  } else {
      console.log("⚠️ NOT STABILIZER OWNER. Stabilizer will use previous oracle, but Stats API will use New Oracle.");
  }

  console.log(`\n💎 PROTOCOL CONFIGURED. PRICE: $215.92`);
}

main().catch(console.error);
