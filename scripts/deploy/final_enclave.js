const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX: FINAL ENCLAVE ACTIVATION (STAGE 4 - FINAL) ---`);
  
  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 8000000 };

  // 1. RECOVER CORE MANIFEST
  const factoryAddr = "0x77DC69B69FCF4337a8771B8D8b31D77b7fE221D8";
  const wdnrAddr = "0x9f30FD46c569f33a103A12a6a918542EC603eD5B";
  const usdcAddr = "0xAf5f1886bB2A80998772697F35e2050e4480FA68";
  const pairAddr = "0xFd73F4c9BC8B67c807033088543F0E790f068893";
  const bridgeAddr = "0xa82c0b5779E219075Fd7509E75c2EB25BFe10aA1";
  const farmAddr = "0xFFEb40cae445F8f625233b652E3a46E87182e2A1";

  // 2. DEPLOY ORACLE
  console.log("Deploying Kortana Oracle...");
  const Oracle = await (await ethers.getContractFactory("KortanaOracle", wallet)).deploy(pairAddr, PARAMS);
  await Oracle.waitForDeployment();
  const oracleAddr = await Oracle.getAddress();
  console.log(`ORACLE:     ${oracleAddr}`);

  // Set Genesis Prices (1 DNR = $215.92, 1 KORTUSD = $1.00)
  const dnrPrice = ethers.parseUnits("215.92", 18);
  const usdPrice = ethers.parseUnits("1", 18);
  await (await Oracle.setManualPrices(dnrPrice, usdPrice, PARAMS)).wait();
  console.log(`PRICES SET: DNR=$215.92, KORTUSD=$1.00`);

  // 3. DEPLOY STABILIZER
  console.log("Deploying Asset Stabilizer...");
  const Stabilizer = await (await ethers.getContractFactory("KortanaStabilizer", wallet)).deploy(
    usdcAddr,     // _kortusd
    oracleAddr,   // _oracle
    wdnrAddr,     // _collateralToken
    wallet.address, // _treasury
    PARAMS
  );
  await Stabilizer.waitForDeployment();
  const stabAddr = await Stabilizer.getAddress();
  console.log(`STABILIZER: ${stabAddr}`);

  // 4. DEPLOY LIQUIDITY MANAGER
  console.log("Deploying Liquidity Manager...");
  const LiqManager = await (await ethers.getContractFactory("KortanaLiquidityManager", wallet)).deploy(factoryAddr, wdnrAddr, PARAMS);
  await LiqManager.waitForDeployment();
  const liqAddr = await LiqManager.getAddress();
  console.log(`LIQ_MGR:    ${liqAddr}`);

  console.log(`\n🚀 TOTAL ENCLAVE LIVE. INSTITUTIONAL SYNC COMMENCING.`);
}

main().catch(console.error);
