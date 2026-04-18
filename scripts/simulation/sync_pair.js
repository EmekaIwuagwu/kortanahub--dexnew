const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const pairAddress = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242";
  const Pair = await ethers.getContractAt("KortanaPair", pairAddress, wallet);

  console.log(`Syncing Pair...`);
  try {
      const tx = await Pair.sync({ type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 1000000 });
      console.log(`Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Sync Success!`);
  } catch (e) {
      console.error(`FAILED: ${e.message}`);
  }
}

main().catch(console.error);
