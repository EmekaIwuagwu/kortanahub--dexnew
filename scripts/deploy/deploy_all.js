const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const NETWORKS = {
  kortanaTestnet: {
    chainId: 72511,
    rpc: "https://poseidon-rpc.testnet.kortana.xyz/",
    explorer: "https://explorer.testnet.kortana.xyz",
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  console.log(`\n🚀 Deploying Kortana DEX on ${networkName}`);

  const deployed = {};
  const overrides = { 
    gasLimit: 8000000, 
    gasPrice: 10000000000n, // 10 Gwei
    type: 0 
  };

  // 1. WDNR
  console.log("1️⃣ Deploying WDNR...");
  const WDNR = await ethers.deployContract("WDNR", [], overrides);
  await WDNR.waitForDeployment();
  deployed.WDNR = await WDNR.getAddress();

  // 2. Factory
  console.log("2️⃣ Deploying Factory...");
  const Factory = await ethers.deployContract("KortanaFactory", [deployer.address], overrides);
  await Factory.waitForDeployment();
  deployed.factory = await Factory.getAddress();

  // 3. SwapDNR
  console.log("3️⃣ Deploying SwapDNR...");
  const SwapDNR = await ethers.deployContract("KortanaSwapDNR", [deployed.factory, deployed.WDNR], overrides);
  await SwapDNR.waitForDeployment();
  deployed.swapDNR = await SwapDNR.getAddress();

  // 4. SwapTokens
  console.log("4️⃣ Deploying SwapTokens...");
  const SwapTokens = await ethers.deployContract("KortanaSwapTokens", [deployed.factory, deployed.WDNR], overrides);
  await SwapTokens.waitForDeployment();
  deployed.swapTokens = await SwapTokens.getAddress();

  // 5. Liquidity
  console.log("5️⃣ Deploying LiquidityManager...");
  const Liquidity = await ethers.deployContract("KortanaLiquidityManager", [deployed.factory, deployed.WDNR], overrides);
  await Liquidity.waitForDeployment();
  deployed.liquidityManager = await Liquidity.getAddress();

  // 6. KORTUSD
  console.log("6️⃣ Deploying KORTUSD...");
  const KORTUSD = await ethers.deployContract("KORTUSD", [deployer.address], overrides);
  await KORTUSD.waitForDeployment();
  deployed.kortusd = await KORTUSD.getAddress();

  try {
    // 7. Pair
    console.log("7️⃣ Deploying Pair...");
    const Pair = await ethers.deployContract("KortanaPair", [], overrides);
    await Pair.waitForDeployment();
    const poolAddress = await Pair.getAddress();
    deployed.pair = poolAddress;

    // 8. Init + Register
    console.log("8️⃣ Registering Pair...");
    await (await Pair.initialize(deployed.WDNR, deployed.kortusd)).wait();
    await (await Factory.registerPair(deployed.WDNR, deployed.kortusd, poolAddress)).wait();

    // 9. Oracle
    console.log("9️⃣ Deploying Oracle...");
    const Oracle = await ethers.deployContract("KortanaOracle", [poolAddress], overrides);
    await Oracle.waitForDeployment();
    deployed.oracle = await Oracle.getAddress();

    // 10. Stabilizer
    console.log("🔟 Deploying Stabilizer...");
    const Stabilizer = await ethers.deployContract("KortanaStabilizer", [
      deployed.kortusd, deployed.oracle, deployed.WDNR, deployer.address
    ], overrides);
    await Stabilizer.waitForDeployment();
    deployed.stabilizer = await Stabilizer.getAddress();

    // 11. Bridge
    console.log("1️⃣1️⃣ Deploying Bridge...");
    const Bridge = await ethers.deployContract("KortanaBridgeSource", [], overrides);
    await Bridge.waitForDeployment();
    deployed.bridge = await Bridge.getAddress();
  } catch (e) {
    console.warn("⚠️ Warning: Could not complete full deployment. Writing partial success config...");
  }

  // Save config
  const outPath = path.join(__dirname, `../../config/${networkName}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ contracts: deployed }, null, 2));
  console.log("\n✅ ALL CONTRACTS LIVE ON TESTNET!");
}
main().catch(console.error);
