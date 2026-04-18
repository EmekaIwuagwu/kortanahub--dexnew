const { ethers } = require("hardhat");

async function main() {
  const factoryAddr = "0xb3e6c27f8D234C69bF053d15D7127Df3e774Fb7e";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";
  const liquidityManagerAddr = "0x48C54e20a46125F788686aBcB9855592073999E6";

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 RELAUNCHING DNR MARKET...`);
  console.log(`Deployer: ${deployer.address}`);

  // 1. Deploy Clean Pair Contract
  console.log("\nStep 1: Deploying New Institutional Pair...");
  const Pair = await ethers.getContractFactory("KortanaPair");
  const pair = await Pair.deploy();
  await pair.waitForDeployment();
  const pairAddr = await pair.getAddress();
  console.log(`✅ New Pair Deployed: ${pairAddr}`);

  // 2. Initialize Pair
  console.log("\nStep 2: Initializing Asset Identities...");
  const [token0, token1] = wdnr < usdck ? [wdnr, usdck] : [usdck, wdnr];
  await pair.initialize(token0, token1);
  console.log(`✅ Pair Anchored to DNR & USDC.k`);

  // 3. Register in Factory
  console.log("\nStep 3: Registering Market in Factory...");
  const factory = await ethers.getContractAt("KortanaFactory", factoryAddr);
  
  // Need to check if a pair already exists to decide whether to register or just use old one
  // But we want a FRESH one, so we should skip if already registered or use a different SALT
  // For now, we attempt to register this one.
  try {
      const regTx = await factory.registerPair(wdnr, usdck, pairAddr);
      await regTx.wait();
      console.log("✅ Market Registered as Official.");
  } catch (e) {
      console.log("⚠️ Registration failed (Market already exists). Using existing registration...");
  }

  // 4. Seed $215.92 Price
  console.log("\nStep 4: Injecting $215.92 Liquidity...");
  const usdckContract = await ethers.getContractAt("IERC20", usdckAddr);
  const manager = await ethers.getContractAt([
    "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)"
  ], liquidityManagerAddr);

  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  await usdckContract.approve(liquidityManagerAddr, usdcAmount * 10n);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const seedTx = await manager.addLiquidityDNR(
    usdckAddr,
    usdcAmount,
    0, 0,
    deployer.address,
    deadline,
    { value: dnrAmount, gasLimit: 3000000, type: 0 }
  );

  await seedTx.wait();
  console.log("\n💎 DNR IS NOW LIVE AT $215.92!");
}

main().catch(console.error);
