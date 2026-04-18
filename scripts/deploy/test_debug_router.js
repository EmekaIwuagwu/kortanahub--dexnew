const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n🚀 [SENIOR ENGINEER] DEPLOYING DEBUG ROUTER...`);

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 6000000 };

  const DebugRouter = await (await ethers.getContractFactory("DebugRouter", wallet)).deploy(PARAMS);
  await DebugRouter.waitForDeployment();
  const routerAddress = await DebugRouter.getAddress();
  console.log(`✅ DebugRouter deployed to: ${routerAddress}`);

  console.log("Testing getQuote...");
  const amountIn = ethers.parseEther("1");
  
  try {
      const amountOut = await DebugRouter.getQuote(amountIn);
      console.log(`SUCCESS! Quote: ${ethers.formatUnits(amountOut, 18)} USDC.k`);
  } catch (e) {
      console.error("FAILED TEST:", e.message);
  }
}

main().catch(console.error);
