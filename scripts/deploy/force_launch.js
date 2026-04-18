const { ethers } = require("hardhat");

async function main() {
  const pairAddr = "0xA77f46bbe153e8508D45E8C096c136643aE08994";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";
  const managerAddr = "0x48C54e20a46125F788686aBcB9855592073999E6";

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 FORCE-ACTIVATING DNR MARKET...`);

  const pair = await ethers.getContractAt([
    "function initialize(address, address) external",
    "function token0() view returns (address)"
  ], pairAddr);

  // 1. Force Initialize
  const t0 = await pair.token0();
  if (t0 === ethers.ZeroAddress) {
      console.log("Step 1: Forcing Asset Identity...");
      const [token0, token1] = wdnr < usdck ? [wdnr, usdck] : [usdck, wdnr];
      const tx = await pair.initialize(token0, token1, { gasLimit: 2000000, type: 0 });
      await tx.wait();
      console.log("✅ Identity Forced.");
  } else {
      console.log("✅ Identity already established.");
  }

  // 2. Inject $215.92
  console.log("\nStep 2: Injecting $215.92 Anchor...");
  const manager = await ethers.getContractAt([
    "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)"
  ], managerAddr);

  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const usdcAmount = ethers.parseUnits("215920", 18);
  const dnrAmount = ethers.parseUnits("1000", 18);

  await usdckContract.approve(managerAddr, usdcAmount * 10n);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const seedTx = await manager.addLiquidityDNR(
    usdck, // Standardised to usdck variable
    usdcAmount,
    0, 0,
    deployer.address,
    deadline,
    { value: dnrAmount, gasLimit: 3000000, type: 0 }
  );

  await seedTx.wait();
  console.log("\n💎 DNR IS LIVE! PRICE: $215.92");
  console.log(`Transaction: ${seedTx.hash}`);
}

main().catch(console.error);
