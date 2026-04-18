const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000, chainId: 9002 };

  const logFile = "trading_k_log.txt";
  fs.writeFileSync(logFile, `--- KORTANA ULTIMATE SOVEREIGN LOG ---\n\n`);
  const log = (m) => { console.log(m); fs.appendFileSync(logFile, m + "\n"); };

  // 1. Deploy Clean Suite
  log("[1] Deploying Unlimited Suite...");
  const UDNRFactory = await ethers.getContractFactory("UltraDinar", wallet);
  const udnr = await UDNRFactory.deploy(PARAMS);
  await udnr.waitForDeployment();
  const udnrAddr = await udnr.getAddress();

  const USDCFactory = await ethers.getContractFactory("SovereignUSDC", wallet);
  const susdc = await USDCFactory.deploy(PARAMS);
  await susdc.waitForDeployment();
  const susdcAddr = await susdc.getAddress();

  const DEXFactory = await ethers.getContractFactory("SovereignPairV3", wallet);
  const dex = await DEXFactory.deploy(udnrAddr, susdcAddr, PARAMS);
  await dex.waitForDeployment();
  const dexAddr = await dex.getAddress();
  log(`   ✅ Sovereign Suite Live. DEX: ${dexAddr}`);

  // 2. Seeding
  log("[2] Seeding Liquidity...");
  const dnrVal = ethers.parseEther("0.1");
  const usdcVal = ethers.parseEther("50.0");
  
  await (await wallet.sendTransaction({ to: udnrAddr, data: udnr.interface.encodeFunctionData("deposit"), value: dnrVal, ...PARAMS })).wait();
  await (await wallet.sendTransaction({ to: udnrAddr, data: udnr.interface.encodeFunctionData("transfer", [dexAddr, dnrVal]), ...PARAMS })).wait();
  await (await wallet.sendTransaction({ to: susdcAddr, data: susdc.interface.encodeFunctionData("transfer", [dexAddr, usdcVal]), ...PARAMS })).wait();
  await (await wallet.sendTransaction({ to: dexAddr, data: dex.interface.encodeFunctionData("sync"), ...PARAMS })).wait();
  log("   ✅ Seeding SUCCESS.");

  // 3. Trade Cycle
  async function trade(label, dOut, sOut) {
    log(`[${label}] Executing...`);
    const tx = await wallet.sendTransaction({
        to: dexAddr,
        data: dex.interface.encodeFunctionData("swap", [dOut, sOut, wallet.address]),
        ...PARAMS
    });
    const r = await tx.wait();
    log(`   ✅ STATUS: ${r.status} | HASH: ${tx.hash}`);
  }

  try {
    await trade("Price Growth: Buy DNR", ethers.parseEther("0.001"), 0);
    await trade("Volume Loop: Buy USDC.k", 0, ethers.parseEther("0.1"));
    log("\n--- MISSION COMPLETE: SYSTEM IS UNRESTRICTED ---");
  } catch (e) {
    log(`\n[REVERT] ${e.message}`);
  }
}

main().catch(console.error);
