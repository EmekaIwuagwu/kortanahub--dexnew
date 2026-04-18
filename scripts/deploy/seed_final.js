const { ethers } = require("hardhat");

async function main() {
  const managerAddr = "0xF8C55806737454064Ef62531a99B047DeE81f5e5";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 ANCHORING PRICE AT $215.92...`);

  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const manager = await ethers.getContractAt([
    "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)"
  ], managerAddr);

  // $215.92 Ratio
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  console.log("Step 1: Approving USDC.k...");
  await usdckContract.approve(managerAddr, usdcAmount * 100n);
  
  console.log("Step 2: Injecting Duo-Asset Liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const tx = await manager.addLiquidityDNR(
    usdck,
    usdcAmount,
    0, 0,
    deployer.address,
    deadline,
    { value: dnrAmount, gasLimit: 5000000, type: 0 }
  );
  
  console.log("⏳ Waiting for price anchor confirmation...");
  const receipt = await tx.wait();
  console.log(`✅ SUCCESS! Price established at ${receipt.hash}`);
  console.log("\n💎 1 DNR = $215.92 USDC.k");
}

main().catch(console.error);
