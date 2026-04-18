const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const routerAddress = "0xAd2d54DFD50d694a489A01F761667f55F579C1cc";
  const pairAddress = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242";

  const Router = await ethers.getContractAt("KortanaAtomicRouter", routerAddress, wallet);

  console.log(`\n🚀 [SENIOR ENGINEER] EXECUTING ATOMIC SWAP TEST...`);
  
  const amountIn = ethers.parseEther("0.1");
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 2000000, value: amountIn };

  try {
      console.log(`Swapping 0.1 DNR for USDC.k via ATOMIC Router...`);
      const tx = await Router.swapDNRForTokens(pairAddress, 0, wallet.address, deadline, PARAMS);
      console.log(`Transaction Sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ ATOMIC SWAP SUCCESS in block ${receipt.blockNumber}`);
  } catch (e) {
      console.error(`❌ ATOMIC SWAP FAILED: ${e.message}`);
  }
}

main().catch(console.error);
