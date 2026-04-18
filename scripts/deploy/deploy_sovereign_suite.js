const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const WDNR_ADDR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000 };

  console.log(`\n--- 🏛️ SOVEREIGN DEPLOYMENT STARTED ---`);

  // 1. Deploy Sovereign USDC.k
  console.log("[1] Deploying Sovereign USDC.k...");
  const USDC = await (await ethers.getContractFactory("SovereignUSDC", wallet)).deploy(PARAMS);
  await USDC.waitForDeployment();
  const usdcAddr = await USDC.getAddress();
  console.log(`✅ Sovereign USDC.k at: ${usdcAddr}`);

  // 2. Deploy Sovereign Pair
  console.log("[2] Deploying Sovereign Pair (Istanbul Optimized)...");
  const Pair = await (await ethers.getContractFactory("SimplePair", wallet)).deploy(WDNR_ADDR, usdcAddr, PARAMS);
  await Pair.waitForDeployment();
  const pairAddr = await Pair.getAddress();
  console.log(`✅ Sovereign Pair at: ${pairAddr}`);

  // 3. Seeding Liquidity
  console.log("[3] Seeding Liquidity (Matching Institutional Depth)...");
  // 10 DNR / 2159 USDC.k for a quick test (I have 1 DNR in wallet)
  const amountDNR = ethers.parseEther("0.5");
  const amountUSDC = ethers.parseEther("107.95");

  const WDNR = await ethers.getContractAt("contracts/amm/KortanaAtomicRouter.sol:IWDNR", WDNR_ADDR, wallet);
  await (await WDNR.deposit({ value: amountDNR, ...PARAMS })).wait();
  await (await WDNR.transfer(pairAddr, amountDNR, PARAMS)).wait();
  await (await USDC.transfer(pairAddr, amountUSDC, PARAMS)).wait();
  await (await Pair.sync(PARAMS)).wait();
  console.log("✅ Seeding Complete.");

  // 4. Verification Swap (USDC.k -> DNR)
  console.log("\n[4] ULTIMATE VERIFICATION (Sell USDC.k -> Get DNR)");
  const testAmount = ethers.parseEther("10");
  const tx = await Pair.swap(ethers.parseEther("0.04"), 0, wallet.address, PARAMS);
  console.log(`Swap TX: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`🏁 VERIFICATION STATUS: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);

  console.log(`\n--- 🗺️ FINAL REGISTRY FOR FRONTEND ---`);
  console.log(`SOVEREIGN_USDC_K: ${usdcAddr}`);
  console.log(`SOVEREIGN_PAIR: ${pairAddr}`);
}

main().catch(console.error);
