const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const pairAddress = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242";
  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  const Pair = await ethers.getContractAt("KortanaPair", pairAddress, wallet);
  const WDNR = await ethers.getContractAt("contracts/amm/KortanaAtomicRouter.sol:IWDNR", wdnrAddr, wallet);

  console.log(`\n🚀 [SENIOR ENGINEER] DIRECT PAIR SWAP TEST...`);

  const amountIn = ethers.parseEther("0.1");
  const amountOut = ethers.parseEther("20"); // 1 DNR = 215 USDC, so 0.1 DNR = 21.5 USDC. 20 is safe.

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 10000000 };

  try {
      console.log(`1. Wrapping 0.1 DNR...`);
      await (await WDNR.deposit({ value: amountIn, ...PARAMS })).wait();
      
      console.log(`2. Transferring 0.1 WDNR to Pair...`);
      await (await WDNR.transfer(pairAddress, amountIn, PARAMS)).wait();
      
      console.log(`3. Calling swap(0, 20 USDC, wallet, "") on Pair...`);
      // token0 is WDNR, token1 is USDC
      const tx = await Pair.swap(0, amountOut, wallet.address, "0x", PARAMS);
      console.log(`Swap Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ DIRECT SWAP SUCCESS!`);
  } catch (e) {
      console.error(`❌ DIRECT SWAP FAILED: ${e.message}`);
  }
}

main().catch(console.error);
