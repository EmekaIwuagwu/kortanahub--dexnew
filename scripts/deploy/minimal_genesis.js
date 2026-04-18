const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX: OMEGA GENESIS (UNBREAKABLE VERSION) ---`);
  
  const PARAMS = { 
    type: 0, 
    gasPrice: ethers.parseUnits("3", "gwei"), 
    gasLimit: 12000000 
  };

  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  // 1. DEPLOY CORE
  console.log("Deploying Sovereign Factory...");
  const Factory = await (await ethers.getContractFactory("KortanaFactory", wallet)).deploy(wallet.address, PARAMS);
  await Factory.waitForDeployment();
  const factoryAddr = await Factory.getAddress();
  console.log(`FACTORY: ${factoryAddr}`);

  console.log("Deploying Unbreakable Pair...");
  const Pair = await (await ethers.getContractFactory("KortanaPair", wallet)).deploy(PARAMS);
  await Pair.waitForDeployment();
  const pairAddr = await Pair.getAddress();
  console.log(`PAIR:    ${pairAddr}`);

  console.log("Initializing Pair...");
  const [t0, t1] = wdnrAddr.toLowerCase() < usdcAddr.toLowerCase() ? [wdnrAddr, usdcAddr] : [usdcAddr, wdnrAddr];
  await (await Pair.initialize(t0, t1, PARAMS)).wait();

  console.log("Registering Pair in Factory...");
  await (await Factory.registerPair(wdnrAddr, usdcAddr, pairAddr, PARAMS)).wait();

  console.log("Deploying Unbreakable Router...");
  const Router = await (await ethers.getContractFactory("KortanaSwapDNR", wallet)).deploy(factoryAddr, wdnrAddr, PARAMS);
  await Router.waitForDeployment();
  const routerAddr = await Router.getAddress();
  console.log(`ROUTER:  ${routerAddr}`);

  // 2. SEED LIQUIDITY ($215.92)
  console.log("Seeding liquidity...");
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  const USDCk = await ethers.getContractAt("KORTUSD", usdcAddr, wallet);
  await (await USDCk.mint(wallet.address, usdcAmount, PARAMS)).wait();
  await (await USDCk.transfer(pairAddr, usdcAmount, PARAMS)).wait();
  
  const wdnrContract = await ethers.getContractAt(["function deposit() payable", "function transfer(address, uint256) returns (bool)"], wdnrAddr, wallet);
  await (await wdnrContract.deposit({ value: dnrAmount, ...PARAMS })).wait();
  await (await wdnrContract.transfer(pairAddr, dnrAmount, PARAMS)).wait();

  console.log("Executing Genesis Sync...");
  await (await Pair.genesisMint(wallet.address, wdnrAddr.toLowerCase() < usdcAddr.toLowerCase() ? dnrAmount : usdcAmount, wdnrAddr.toLowerCase() < usdcAddr.toLowerCase() ? usdcAmount : dnrAmount, PARAMS)).wait();

  // 3. AUXILIARY
  console.log("Deploying Enclave Suite...");
  const Bridge = await (await ethers.getContractFactory("KortanaBridgeSource", wallet)).deploy(PARAMS);
  await Bridge.waitForDeployment();
  const bridgeAddr = await Bridge.getAddress();

  const Farm = await (await ethers.getContractFactory("KortanaFarm", wallet)).deploy(pairAddr, usdcAddr, ethers.parseUnits("0.1", 18), PARAMS);
  await Farm.waitForDeployment();
  const farmAddr = await Farm.getAddress();

  const Stabilizer = await (await ethers.getContractFactory("KortanaStabilizer", wallet)).deploy(usdcAddr, wallet.address, wdnrAddr, wallet.address, PARAMS);
  await Stabilizer.waitForDeployment();
  const stabAddr = await Stabilizer.getAddress();

  console.log(`\n🚀 OMEGA GENESIS COMPLETE.`);
  console.log(`FACTORY:    ${factoryAddr}`);
  console.log(`ROUTER:     ${routerAddr}`);
  console.log(`PAIR:       ${pairAddr}`);
  console.log(`BRIDGE:     ${bridgeAddr}`);
  console.log(`FARM:       ${farmAddr}`);
  console.log(`STABILIZER: ${stabAddr}`);

  // 4. AUTOMATED FRONTEND SYNC
  const fs = require("fs");
  const path = "frontend/src/lib/contracts.ts";
  let content = fs.readFileSync(path, "utf-8");
  content = content.replace(/FACTORY: "0x[a-fA-F0-9]{40}"/, `FACTORY: "${factoryAddr}"`);
  content = content.replace(/ROUTER: "0x[a-fA-F0-9]{40}"/, `ROUTER: "${routerAddr}"`);
  content = content.replace(/PAIR_DNR_USDC: "0x[a-fA-F0-9]{40}"/, `PAIR_DNR_USDC: "${pairAddr}"`);
  content = content.replace(/BRIDGE: "0x[a-fA-F0-9]{40}"/, `BRIDGE: "${bridgeAddr}"`);
  content = content.replace(/FARM: "0x[a-fA-F0-9]{40}"/, `FARM: "${farmAddr}"`);
  content = content.replace(/STABILIZER: "0x[a-fA-F0-9]{40}"/, `STABILIZER: "${stabAddr}"`);
  fs.writeFileSync(path, content);
  console.log("Frontend contracts.ts synchronized!");
}

main().catch(console.error);
