const { ethers } = require("hardhat");

async function main() {
  const managerAddr = "0xF8C55806737454064Ef62531a99B047DeE81f5e5";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 NANO-ANCHORING PRICE AT $215.92...`);

  // Nano-Ratio for $215.92
  const dnrAmount = ethers.parseUnits("10", 18);          // 10 DNR
  const usdcAmount = ethers.parseUnits("2159.2", 18);     // 2159.2 USDC.k

  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const manager = await ethers.getContractAt([
    "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)"
  ], managerAddr);

  console.log("Step 1: Approving USDC.k...");
  await usdckContract.approve(managerAddr, usdcAmount * 10n);
  
  console.log("Step 2: Injecting Nano-Liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const tx = await manager.addLiquidityDNR(
    usdck,
    usdcAmount,
    0, 0,
    deployer.address,
    deadline,
    { value: dnrAmount, gasLimit: 1000000, type: 0 }
  );
  
  await tx.wait();
  console.log("\n💎 SUCCESS! 1 DNR = $215.92");
}

main().catch(console.error);
