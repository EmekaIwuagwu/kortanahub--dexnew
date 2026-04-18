const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const routerAddress = "0xAd2d54DFD50d694a489A01F761667f55F579C1cc";
  const pairAddress = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";
  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const Router = await ethers.getContractAt("KortanaAtomicRouter", routerAddress, wallet);
  const Token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcAddr, wallet);

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 3000000 };
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  console.log(`\n🚀 [SENIOR ENGINEER] EXECUTING LIVE SWAP VERIFICATION (NEW PAIR)...`);

  // 1. Sell DNR -> Buy USDC.k
  console.log("\n[TX 1] Selling 0.1 DNR for USDC.k...");
  try {
      const tx1 = await Router.swapDNRForTokens(pairAddress, 0, wallet.address, deadline, { ...PARAMS, value: ethers.parseEther("0.1") });
      console.log(`Hash: ${tx1.hash}`);
      const r1 = await tx1.wait();
      console.log(`✅ TX 1 STATUS: ${r1.status === 1 ? 'SUCCESS' : 'FAILED'}`);
  } catch (e) { console.error(`❌ TX 1 ERROR: ${e.message}`); }

  // 2. Buy DNR -> Sell USDC.k
  console.log("\n[TX 2] Selling (10) USDC.k for DNR...");
  try {
      console.log("Approving USDC.k...");
      await (await Token.approve(routerAddress, ethers.parseEther("10"), PARAMS)).wait();
      const tx2 = await Router.swapTokensForDNR(pairAddress, usdcAddr, ethers.parseEther("10"), 0, wallet.address, deadline, PARAMS);
      console.log(`Hash: ${tx2.hash}`);
      const r2 = await tx2.wait();
      console.log(`✅ TX 2 STATUS: ${r2.status === 1 ? 'SUCCESS' : 'FAILED'}`);
  } catch (e) { console.error(`❌ TX 2 ERROR: ${e.message}`); }
}

main().catch(console.error);
