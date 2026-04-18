const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const factoryAddr = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191";
  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const newPair = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";

  const Factory = await ethers.getContractAt("KortanaFactory", factoryAddr, wallet);

  console.log(`Registering New Stable Pair in Global Factory...`);
  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 2000000 };

  try {
      const tx = await Factory.registerPair(wdnr, usdc, newPair, PARAMS);
      await tx.wait();
      console.log(`✅ Pair Registered Successfully in Factory!`);
  } catch (e) {
      console.error(`FAILED: ${e.message}`);
  }
}

main().catch(console.error);
