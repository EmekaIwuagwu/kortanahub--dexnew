const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n🚀 [SENIOR ENGINEER] DEPLOYING KORTANA ROUTER...`);

  const factory = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191";
  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 6000000 };

  const Router = await (await ethers.getContractFactory("KortanaRouter", wallet)).deploy(factory, wdnr, PARAMS);
  await Router.waitForDeployment();
  const routerAddress = await Router.getAddress();
  console.log(`✅ KortanaRouter deployed to: ${routerAddress}`);

  // Test it immediately
  console.log("Testing getAmountsOut...");
  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const amountIn = ethers.parseEther("1");
  const swapPath = [wdnr, usdc];
  
  try {
      const amounts = await Router.getAmountsOut(amountIn, swapPath);
      console.log(`SUCCESS! 1 DNR = ${ethers.formatUnits(amounts[1], 18)} USDC.k`);
  } catch (e) {
      console.error("FAILED TEST:", e.message);
  }
}

main().catch(console.error);
