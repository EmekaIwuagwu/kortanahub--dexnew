const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  
  if (networkName === "hardhat") {
      console.error("Please run on a live network!");
      return;
  }

  console.log(`\n🚀 Redeploying Router & SwapDNR on ${networkName} with getAmountsOut support`);

  const overrides = { 
    gasLimit: 8000000, 
    gasPrice: 10000000000n, // 10 Gwei
    type: 0 
  };

  // Load existing config
  const configPath = path.join(__dirname, `../../config/${networkName}.json`);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  const factory = config.contracts.factory;
  const wdnr = config.contracts.WDNR;

  console.log(`Using Factory: ${factory}`);
  console.log(`Using WDNR: ${wdnr}`);

  // 1. Redeploy SwapDNR
  console.log("1️⃣ Redeploying KortanaSwapDNR...");
  const SwapDNR = await ethers.deployContract("KortanaSwapDNR", [factory, wdnr], overrides);
  await SwapDNR.waitForDeployment();
  const swapDnrAddress = await SwapDNR.getAddress();
  console.log(`✅ KortanaSwapDNR deployed to: ${swapDnrAddress}`);

  // 2. Redeploy KortanaRouter
  console.log("2️⃣ Redeploying KortanaRouter...");
  const Router = await ethers.deployContract("KortanaRouter", [factory, wdnr], overrides);
  await Router.waitForDeployment();
  const routerAddress = await Router.getAddress();
  console.log(`✅ KortanaRouter deployed to: ${routerAddress}`);

  // Update Config
  config.contracts.swapDNR = swapDnrAddress;
  config.contracts.router = routerAddress; // Adding it specifically

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("\n✅ CONFIG UPDATED!");
}

main().catch(console.error);
