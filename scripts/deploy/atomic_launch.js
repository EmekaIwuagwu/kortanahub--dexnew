const { ethers } = require("hardhat");

async function main() {
  const factoryAddr = "0x2e29B9b6c2945710A9444E71fBFd3472AfF325f5";
  const managerAddr = "0xF8C55806737454064Ef62531a99B047DeE81f5e5";
  const pairAddr = "0x3548c5486B06c8D83935Cb57b03c1b7CEBfEe32E";
  
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀 ATOMIC MARKET ACTIVATION ($215.92)...`);

  const factory = await ethers.getContractAt("KortanaFactory", factoryAddr);
  
  // Step 1: Explicit Registration
  console.log("Step 1: Binding Factory to Market...");
  const currentPair = await factory.getPair(wdnr, usdck);
  
  if (currentPair === ethers.ZeroAddress) {
      const regTx = await factory.registerPair(wdnr, usdck, pairAddr, { type: 0 });
      await regTx.wait();
      console.log("✅ Market Binding Complete.");
  } else {
      console.log(`✅ Market already bound to ${currentPair}`);
  }

  // Step 2: Verification
  const verifiedPair = await factory.getPair(wdnr, usdck);
  if (verifiedPair.toLowerCase() === pairAddr.toLowerCase()) {
      console.log("✅ ON-CHAIN VERIFICATION SUCCESSFUL.");
  } else {
      throw new Error(`❌ VERIFICATION FAILED: Factory returned ${verifiedPair}`);
  }

  // Step 3: Atomic Seeding
  console.log("\nStep 3: Injecting $215.92 Anchor...");
  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const manager = await ethers.getContractAt([
    "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)"
  ], managerAddr);

  // $215.92 Ratio
  // We pair 1,000 DNR with 215,920 USDC.k
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  console.log("- Approving Liquidity Pathway...");
  const appTx = await usdckContract.approve(managerAddr, usdcAmount * 10n);
  await appTx.wait();

  console.log("- Sending Anchor Transaction...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const tx = await manager.addLiquidityDNR(
    usdck,
    usdcAmount,
    0, 0,
    deployer.address,
    deadline,
    { value: dnrAmount, gasLimit: 5000000, type: 0 }
  );
  
  const receipt = await tx.wait();
  console.log(`✅ ATOMIC LAUNCH SUCCESS! Hash: ${receipt.hash}`);
  console.log("\n💎 DNR MARKET IS NOW LIVE AT $215.92");
}

main().catch(console.error);
