const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX: OMEGA GENESIS (PHASE 2 - SOVEREIGN REGISTRATION) ---`);
  
  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 8000000 };

  // 1. RECOVER MANIFESTED ADDRESSES
  const factoryAddr = "0x77DC69B69FCF4337a8771B8D8b31D77b7fE221D8";
  const routerAddr = "0x6195D33624db5218F2EC23F0d069cfd734f98b5a";
  const usdcAddr = "0xAf5f1886bB2A80998772697F35e2050e4480FA68";
  const wdnrAddr = "0x9f30FD46c569f33a103A12a6a918542EC603eD5B";

  const Factory = await ethers.getContractAt("KortanaFactory", factoryAddr, wallet);
  const USDCk = await ethers.getContractAt("KORTUSD", usdcAddr, wallet);

  // 2. SOVEREIGN PAIR DEPLOYMENT
  console.log("Deploying Pair contract...");
  const PairFactory = await ethers.getContractFactory("KortanaPair", wallet);
  const pairContract = await PairFactory.deploy(PARAMS);
  await pairContract.waitForDeployment();
  const pairAddr = await pairContract.getAddress();
  console.log(`PAIR ADDRESS: ${pairAddr}`);

  console.log("Initializing Pair tokens...");
  const [t0, t1] = wdnrAddr.toLowerCase() < usdcAddr.toLowerCase() ? [wdnrAddr, usdcAddr] : [usdcAddr, wdnrAddr];
  await (await pairContract.initialize(t0, t1, PARAMS)).wait();

  console.log("Registering Pair in Factory...");
  await (await Factory.registerPair(wdnrAddr, usdcAddr, pairAddr, PARAMS)).wait();
  
  // 3. SEED LIQUIDITY ($215.92)
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  console.log("Seeding assets...");
  await (await USDCk.mint(wallet.address, usdcAmount, PARAMS)).wait();
  await (await USDCk.transfer(pairAddr, usdcAmount, PARAMS)).wait();
  
  const wdnrContract = await ethers.getContractAt(["function deposit() payable", "function transfer(address, uint256) returns (bool)"], wdnrAddr, wallet);
  await (await wdnrContract.deposit({ value: dnrAmount, ...PARAMS })).wait();
  await (await wdnrContract.transfer(pairAddr, dnrAmount, PARAMS)).wait();

  console.log("Executing Genesis Sync...");
  await (await pairContract.genesisMint(wallet.address, wdnrAddr.toLowerCase() < usdcAddr.toLowerCase() ? dnrAmount : usdcAmount, wdnrAddr.toLowerCase() < usdcAddr.toLowerCase() ? usdcAmount : dnrAmount, PARAMS)).wait();

  // 4. DEPLOY AUXILIARY Suite
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

  console.log(`\n🚀 OMEGA GENESIS COMPLETE. TOTAL SUITE ARCHIVED.`);
  console.log(`--- PRODUCTION MANIFEST ---`);
  console.log(`FACTORY:    ${factoryAddr}`);
  console.log(`ROUTER:     ${routerAddr}`);
  console.log(`USDC.k:     ${usdcAddr}`);
  console.log(`WDNR:       ${wdnrAddr}`);
  console.log(`PAIR:       ${pairAddr}`);
  console.log(`BRIDGE:     ${bridgeAddr}`);
  console.log(`STABILIZER: ${stabAddr}`);
  console.log(`FARM:       ${farmAddr}`);
  console.log(`LIQ_MGR:    ${liqAddr}`);
}

main().catch(console.error);
