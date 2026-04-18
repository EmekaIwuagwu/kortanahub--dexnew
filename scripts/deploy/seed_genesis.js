const { ethers } = require("hardhat");

async function main() {
  const liquidityManagerAddr = "0x48C54e20a46125F788686aBcB9855592073999E6";
  const usdckAddr = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  // $215.92 Ratio
  // We will pair 1,000 DNR with 215,920 USDC.k
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  console.log("🌊 Establishing $215.92 GENESIS PRICE...");
  console.log(`- Liquidity Manager: ${liquidityManagerAddr}`);
  console.log(`- Amount: 1,000 DNR & 215,920 USDC.k`);

  const [deployer] = await ethers.getSigners();
  const usdck = await ethers.getContractAt("IERC20", usdckAddr);
  
  const manager = await ethers.getContractAt([
    "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)"
  ], liquidityManagerAddr);

  // 1. Approve Manager
  console.log("\nStep 1: Approving Liquidity Manager for USDC.k...");
  const approveTx = await usdck.approve(liquidityManagerAddr, usdcAmount * 100n);
  await approveTx.wait();
  console.log("✅ Approved.");

  // 2. Add Liquidity
  console.log("\nStep 2: Injecting Duo-Asset Liquidity for $215.92 Price Anchor...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const tx = await manager.addLiquidityDNR(
    usdckAddr,
    usdcAmount,
    0,
    0,
    deployer.address,
    deadline,
    { 
        value: dnrAmount, 
        gasLimit: 3000000,
        type: 0 
    }
  );

  console.log("⏳ Waiting for on-chain price finalization...");
  const receipt = await tx.wait();
  console.log(`✅ SUCCESS! Price established at ${receipt.hash}`);
}

main().catch(console.error);
