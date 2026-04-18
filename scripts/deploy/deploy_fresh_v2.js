const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n🚀 [SENIOR ENGINEER] DEPLOYING FRESH V2 FACTORY (PARIS TARGET)...`);

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 8000000 };

  const Factory = await (await ethers.getContractFactory("KortanaFactory", wallet)).deploy(wallet.address, PARAMS);
  await Factory.waitForDeployment();
  const factoryAddress = await Factory.getAddress();
  console.log(`✅ Fresh Factory deployed to: ${factoryAddress}`);

  console.log(`\nCreating DNR/USDC.k Pair...`);
  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  
  const tx = await Factory.createPair(wdnr, usdc, PARAMS);
  console.log(`CreatePair Tx: ${tx.hash}`);
  const receipt = await tx.wait();
  
  const pairAddress = await Factory.getPair(wdnr, usdc);
  console.log(`✅ Fresh Pair manifest at: ${pairAddress}`);
}

main().catch(console.error);
