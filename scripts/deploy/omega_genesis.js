const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX: OMEGA GENESIS (RETRY WITH 15M GAS) ---`);
  
  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 15000000 };

  // 1. DEPLOY ASSETS
  console.log("Deploying assets...");
  const USDCk = await (await ethers.getContractFactory("KORTUSD", wallet)).deploy(wallet.address, PARAMS);
  await USDCk.waitForDeployment();
  const usdcAddr = await USDCk.getAddress();
  console.log(`USDC.k: ${usdcAddr}`);

  const WDNR = await (await ethers.getContractFactory("WDNR", wallet)).deploy(PARAMS);
  await WDNR.waitForDeployment();
  const wdnrAddr = await WDNR.getAddress();
  console.log(`WDNR:   ${wdnrAddr}`);

  // 2. DEPLOY CORE AMM
  console.log("Deploying AMM...");
  const Factory = await (await ethers.getContractFactory("KortanaFactory", wallet)).deploy(wallet.address, PARAMS);
  await Factory.waitForDeployment();
  const factoryAddr = await Factory.getAddress();
  console.log(`FACTORY: ${factoryAddr}`);

  const Router = await (await ethers.getContractFactory("KortanaRouter", wallet)).deploy(factoryAddr, wdnrAddr, PARAMS);
  await Router.waitForDeployment();
  const routerAddr = await Router.getAddress();
  console.log(`ROUTER:  ${routerAddr}`);

  // 3. SEED LIQUIDITY ($215.92)
  console.log("Seeding initial liquidity...");
  await (await Factory.createPair(wdnrAddr, usdcAddr, PARAMS)).wait();
  const pairAddr = await Factory.getPair(wdnrAddr, usdcAddr);
  console.log(`PAIR:    ${pairAddr}`);
  
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  await (await USDCk.mint(wallet.address, usdcAmount, PARAMS)).wait();
  await (await USDCk.transfer(pairAddr, usdcAmount, PARAMS)).wait();
  
  const wdnrContract = await ethers.getContractAt(["function deposit() payable", "function transfer(address, uint256) returns (bool)"], wdnrAddr, wallet);
  await (await wdnrContract.deposit({ value: dnrAmount, ...PARAMS })).wait();
  await (await wdnrContract.transfer(pairAddr, dnrAmount, PARAMS)).wait();

  const Pair = await ethers.getContractAt("KortanaPair", pairAddr, wallet);
  await (await Pair.genesisMint(wallet.address, wdnrAddr < usdcAddr ? dnrAmount : usdcAmount, wdnrAddr < usdcAddr ? usdcAmount : dnrAmount, PARAMS)).wait();

  // 4. DEPLOY AUXILIARY
  console.log("Deploying Auxiliary Enclave...");
  const Bridge = await (await ethers.getContractFactory("KortanaBridge", wallet)).deploy(PARAMS);
  await Bridge.waitForDeployment();
  const bridgeAddr = await Bridge.getAddress();
  console.log(`BRIDGE:  ${bridgeAddr}`);

  const Stabilizer = await (await ethers.getContractFactory("KortanaSwapDNR", wallet)).deploy(usdcAddr, PARAMS);
  await Stabilizer.waitForDeployment();
  const stabAddr = await Stabilizer.getAddress();
  console.log(`STAB:    ${stabAddr}`);

  const Farm = await (await ethers.getContractFactory("KortanaFarm", wallet)).deploy(wdnrAddr, PARAMS);
  await Farm.waitForDeployment();
  const farmAddr = await Farm.getAddress();
  console.log(`FARM:    ${farmAddr}`);

  const LiqManager = await (await ethers.getContractFactory("KortanaLiquidityManager", wallet)).deploy(factoryAddr, wdnrAddr, PARAMS);
  await LiqManager.waitForDeployment();
  const liqAddr = await LiqManager.getAddress();
  console.log(`LIQ_MGR: ${liqAddr}`);

  console.log(`\n🚀 OMEGA GENESIS COMPLETE. ALL SYSTEMS LIVE.`);
}

main().catch(console.error);
