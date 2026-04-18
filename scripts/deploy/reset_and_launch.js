const { ethers } = require("hardhat");

async function main() {
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 RESETTING INFRASTRUCTURE FOR $215.92...`);

  // 1. Deploy Factory
  console.log("Step 1: Deploying New Factory...");
  const Factory = await ethers.getContractFactory("KortanaFactory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`✅ Factory: ${factoryAddr}`);

  // 2. Deploy Manager
  console.log("Step 2: Deploying New Liquidity Manager...");
  const Manager = await ethers.getContractFactory("KortanaLiquidityManager");
  const manager = await Manager.deploy(factoryAddr, wdnr);
  await manager.waitForDeployment();
  const managerAddr = await manager.getAddress();
  console.log(`✅ Manager: ${managerAddr}`);

  // 3. Create & Initialize Pair
  console.log("Step 3: Creating DNR Market...");
  const Pair = await ethers.getContractFactory("KortanaPair");
  const pairContract = await Pair.deploy();
  await pairContract.waitForDeployment();
  const pairAddr = await pairContract.getAddress();
  
  const [token0, token1] = wdnr < usdck ? [wdnr, usdck] : [usdck, wdnr];
  await pairContract.initialize(token0, token1);
  await factory.registerPair(wdnr, usdck, pairAddr);
  console.log(`✅ Market Created: ${pairAddr}`);

  // 4. Inject $215.92
  console.log("Step 4: Anchoring Price at $215.92...");
  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const usdcAmount = ethers.parseUnits("215920", 18);
  const dnrAmount = ethers.parseUnits("1000", 18);

  await usdckContract.approve(managerAddr, usdcAmount * 10n);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const tx = await manager.addLiquidityDNR(
    usdck,
    usdcAmount,
    0, 0,
    deployer.address,
    deadline,
    { value: dnrAmount, gasLimit: 3000000, type: 0 }
  );
  await tx.wait();

  console.log("\n💎 DNR IS LIVE ON NEW INFRA! PRICE: $215.92");
  console.log(`NEW FACTORY: ${factoryAddr}`);
  console.log(`NEW MANAGER: ${managerAddr}`);
}

main().catch(console.error);
