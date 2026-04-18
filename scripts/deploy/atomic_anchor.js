const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX: ATOMIC LIQUIDITY ANCHOR ---`);
  
  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 8000000 };

  // 1. RECOVER MANIFEST
  const routerAddr = "0x6195D33624db5218F2EC23F0d069cfd734f98b5a";
  const usdcAddr = "0xAf5f1886bB2A80998772697F35e2050e4480FA68";
  const wdnrAddr = "0x9f30FD46c569f33a103A12a6a918542EC603eD5B";

  const Router = await ethers.getContractAt("KortanaRouter", routerAddr, wallet);
  const USDCk = await ethers.getContractAt("KORTUSD", usdcAddr, wallet);
  const WDNR = await ethers.getContractAt(["function deposit() payable", "function approve(address, uint256) returns (bool)"], wdnrAddr, wallet);

  // 2. PREPARE ASSETS
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  console.log("Wrapping Native Dinar...");
  await (await WDNR.deposit({ value: dnrAmount, ...PARAMS })).wait();
  
  console.log("Approving Router...");
  await (await USDCk.approve(routerAddr, usdcAmount, PARAMS)).wait();
  await (await WDNR.approve(routerAddr, dnrAmount, PARAMS)).wait();

  // 3. ADD LIQUIDITY (STANDARD PATH)
  console.log("Seeding $215,920 USDC.k into production pool...");
  await (await Router.addLiquidity(
    wdnrAddr,
    usdcAddr,
    dnrAmount,
    usdcAmount,
    0, // Slippage ignored for genesis
    0,
    wallet.address,
    Math.floor(Date.now() / 1000) + 3600,
    PARAMS
  )).wait();

  console.log(`\n🚀 LIQUIDITY CEMENTED. POOL IS NOW BUOYANT.`);
  console.log(`ANCHOR PRICE: 1 DNR = $215.92`);
}

main().catch(console.error);
