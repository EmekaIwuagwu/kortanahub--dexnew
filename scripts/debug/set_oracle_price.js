const hre = require("hardhat");

async function main() {
  const oracleAddress = "0x59D020682c387d295a4414DF766ff0c3B3Cf3BfB"; 
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Setting Oracle Price with account:", deployer.address);

  const Oracle = await hre.ethers.getContractAt("KortanaOracle", oracleAddress);

  // Set DNR (Collateral) price to $0.10 (18 decimals)
  // Set KUSD price to $1.00 (18 decimals)
  const collateralPrice = hre.ethers.parseUnits("0.10", 18);
  const kusdPrice = hre.ethers.parseUnits("1.00", 18);

  const tx = await Oracle.setManualPrices(collateralPrice, kusdPrice);
  await tx.wait();

  console.log("✅ Oracle Prices Updated!");
  console.log("DNR (Collateral): $0.10");
  console.log("KUSD: $1.00");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
