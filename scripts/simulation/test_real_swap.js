const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const routerAddress = "0x9690feD6B9c5b8DDeF10BcE7ADFC328F7D91f32A";
  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const Router = await ethers.getContractAt("KortanaSwapDNR", routerAddress, wallet);

  console.log(`\n🚀 [SENIOR ENGINEER] EXECUTING REAL SWAP TRANSACTION...`);
  console.log(`Wallet: ${wallet.address}`);
  
  const amountIn = ethers.parseEther("0.1"); // Small test
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
  const path = [wdnr, usdc];

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 2000000, value: amountIn };

  try {
      console.log(`Swapping 0.1 DNR for USDC.k via Router...`);
      const tx = await Router.swapExactDNRForTokens(0, path, wallet.address, deadline, PARAMS);
      console.log(`Transaction Sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Transaction SUCCESS in block ${receipt.blockNumber}`);
  } catch (e) {
      console.error(`❌ Transaction FAILED: ${e.message}`);
      if (e.data) console.error(`Error Data: ${e.data}`);
  }
}

main().catch(console.error);
