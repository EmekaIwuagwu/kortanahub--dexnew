const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n🚀 [SENIOR ENGINEER] DEPLOYING ATOMIC ROUTER...`);

  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 8000000 };

  const Router = await (await ethers.getContractFactory("KortanaAtomicRouter", wallet)).deploy(wdnr, PARAMS);
  await Router.waitForDeployment();
  const routerAddress = await Router.getAddress();
  console.log(`✅ KortanaAtomicRouter deployed to: ${routerAddress}`);
}

main().catch(console.error);
