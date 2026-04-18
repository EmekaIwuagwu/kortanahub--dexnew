const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const WDNR_ADDR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const USDC_ADDR = "0x6Fb3C4d6912f6Ac685B5874E8D2A6d381340B080"; // My previous Sovereign USDC.k
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 5000000 };

  console.log(`\n--- 🏺 SOVEREIGN V3 DEPLOYMENT ---`);

  const Pair = await (await ethers.getContractFactory("SovereignPairV3", wallet)).deploy(WDNR_ADDR, USDC_ADDR, PARAMS);
  await Pair.waitForDeployment();
  const pairAddr = await Pair.getAddress();
  console.log(`✅ SovereignPairV3 at: ${pairAddr}`);

  // Seeding
  const amountDNR = ethers.parseEther("0.1");
  const amountUSDC = ethers.parseEther("21.59");
  
  const WDNR = await ethers.getContractAt("contracts/amm/KortanaAtomicRouter.sol:IWDNR", WDNR_ADDR, wallet);
  const USDC = await ethers.getContractAt("SovereignUSDC", USDC_ADDR, wallet);
  
  await (await WDNR.deposit({ value: amountDNR, ...PARAMS })).wait();
  await (await WDNR.transfer(pairAddr, amountDNR, PARAMS)).wait();
  await (await USDC.transfer(pairAddr, amountUSDC, PARAMS)).wait();
  await (await Pair.sync(PARAMS)).wait();
  console.log("✅ Seeding Complete.");

  // V3 Verification
  console.log("\n[VERIFICATION] High-Speed Swap Test...");
  const tx = await Pair.swap(0, ethers.parseEther("1"), wallet.address, PARAMS);
  console.log(`Swap TX: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`🏁 V3 STATUS: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);
}

main().catch(console.error);
