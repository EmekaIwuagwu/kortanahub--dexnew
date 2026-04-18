const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const usdckAddr = "0x6D4c3a8440420717b6CA749119739647F6c3997D";
  const wdnrAddr = "0xB676c05C9053C64CF78291Dfb9f9c66C0DA0D71b";
  const pairAddr = "0xB81c33B498671fD4a355443660e16Ff1854E4c8D";

  console.log(`\n--- ⚡ MAINNET GAS BLITZ ($215.92) ---`);
  
  const usdck = await ethers.getContractAt("KORTUSD", usdckAddr, wallet);
  const pair = await ethers.getContractAt("KortanaPair", pairAddr, wallet);
  const wdnr = await ethers.getContractAt([
    "function deposit() payable",
    "function transfer(address, uint256) returns (bool)"
  ], wdnrAddr, wallet);

  const usdcAmount = ethers.parseUnits("215920", 18);
  const dnrAmount = ethers.parseUnits("1000", 18);

  // FORCE MINT
  console.log("1. Forced Minting Assets...");
  const tx1 = await usdck.mint(wallet.address, usdcAmount * 100n, { 
    gasPrice: ethers.parseUnits("100", "gwei"),
    gasLimit: 1000000,
    type: 0 
  });
  await tx1.wait();
  console.log("✅ Assets Minted.");

  // FORCE SEED
  console.log("2. Forced Seeding...");
  await (await wdnr.deposit({ value: dnrAmount, gasPrice: ethers.parseUnits("100", "gwei"), type: 0 })).wait();
  await (await wdnr.transfer(pairAddr, dnrAmount, { gasPrice: ethers.parseUnits("100", "gwei"), type: 0 })).wait();
  await (await usdck.transfer(pairAddr, usdcAmount, { gasPrice: ethers.parseUnits("100", "gwei"), type: 0 })).wait();
  
  const tx2 = await pair.mint(wallet.address, { 
    gasPrice: ethers.parseUnits("100", "gwei"),
    gasLimit: 5000000,
    type: 0 
  });
  await tx2.wait();

  console.log(`\n💎 MISSION ACCOMPLISHED. DNR IS LIVE AT $215.92`);
}

main().catch(console.error);
