const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n🚀 [SENIOR ENGINEER] DEPLOYING MANUAL PAIR...`);

  const factory = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191";
  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 8000000 };

  const Pair = await (await ethers.getContractFactory("KortanaPair", wallet)).deploy(PARAMS);
  await Pair.waitForDeployment();
  const pairAddress = await Pair.getAddress();
  console.log(`✅ Manual Pair deployed to: ${pairAddress}`);

  console.log(`Initializing Pair...`);
  // function initialize(address _token0, address _token1)
  const tx = await Pair.initialize(wdnr, usdc, PARAMS);
  await tx.wait();
  console.log(`✅ Pair Initialized with WDNR/USDC.k`);
}

main().catch(console.error);
