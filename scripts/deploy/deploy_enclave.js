const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX: TOTAL ENCLAVE GENESIS (ZEUS MAINNET) ---`);
  
  const LEGACY_PARAMS = {
    type: 0,
    gasPrice: ethers.parseUnits("3", "gwei"),
    gasLimit: 6000000
  };

  // 1. Recover and NORMALIZE core assets
  const WDNR = ethers.getAddress("0xEB7EAf34FDC051191F99DA56c4DFa267C562aEBA".toLowerCase());
  const USDCk = ethers.getAddress("0x14051DfcCb6C983058BB74DFD021896759c8AdEBA".toLowerCase());
  const FACTORY = ethers.getAddress("0x429E57252Cf186E91F99da5634789Bc591a351De".toLowerCase());

  // 2. Deploy Stabilizer
  console.log("deploying Stabilizer...");
  const Stabilizer = await ethers.getContractFactory("KortanaSwapDNR", wallet);
  const stabilizer = await Stabilizer.deploy(USDCk, { ...LEGACY_PARAMS });
  await stabilizer.waitForDeployment();
  const stabilizerAddr = await stabilizer.getAddress();

  // 3. Deploy Bridge
  console.log("deploying Bridge...");
  const Bridge = await ethers.getContractFactory("KortanaBridge", wallet);
  const bridge = await Bridge.deploy({ ...LEGACY_PARAMS });
  await bridge.waitForDeployment();
  const bridgeAddr = await bridge.getAddress();

  // 4. Deploy Farm
  console.log("deploying Farm...");
  const Farm = await ethers.getContractFactory("KortanaFarm", wallet);
  const farm = await Farm.deploy(WDNR, { ...LEGACY_PARAMS });
  await farm.waitForDeployment();
  const farmAddr = await farm.getAddress();

  // 5. Deploy Liquidity Manager
  console.log("deploying Liquidity Manager...");
  const LiquidityManager = await ethers.getContractFactory("KortanaLiquidityManager", wallet);
  const liqManager = await LiquidityManager.deploy(FACTORY, WDNR, { ...LEGACY_PARAMS });
  await liqManager.waitForDeployment();
  const liqManagerAddr = await liqManager.getAddress();

  console.log(`\n🚀 TOTAL GENESIS COMPLETE`);
  console.log(`STABILIZER: ${stabilizerAddr}`);
  console.log(`BRIDGE:     ${bridgeAddr}`);
  console.log(`FARM:       ${farmAddr}`);
  console.log(`LIQ_MGR:    ${liqManagerAddr}`);
}

main().catch(console.error);
