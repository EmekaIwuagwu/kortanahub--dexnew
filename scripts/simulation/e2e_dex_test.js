const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const ATOMIC_ROUTER = "0xAd2d54DFD50d694a489A01F761667f55F579C1cc";
  const PAIR = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242";
  const USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const WDNR = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  const Router = await ethers.getContractAt("KortanaAtomicRouter", ATOMIC_ROUTER, wallet);
  const Token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDCK, wallet);

  console.log(`\n--- 🧪 KORTANA DEX E2E TEST ---`);
  console.log(`Wallet: ${wallet.address}`);

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 3000000 };

  // 1. Swap DNR -> USDC.k
  console.log("\n[TEST 1] Swapping DNR for USDC.k...");
  try {
    const amountIn = ethers.parseEther("0.1");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
    const tx1 = await Router.swapDNRForTokens(PAIR, 0, wallet.address, deadline, { ...PARAMS, value: amountIn });
    console.log(`Tx Sent: ${tx1.hash}`);
    await tx1.wait();
    console.log(`✅ TEST 1 SUCCESS!`);
  } catch (e) {
    console.error(`❌ TEST 1 FAILED: ${e.message}`);
  }

  // 2. Approve USDC.k
  console.log("\n[TEST 2] Approving USDC.k for Router...");
  try {
    const tx2 = await Token.approve(ATOMIC_ROUTER, ethers.MaxUint256, PARAMS);
    await tx2.wait();
    console.log(`✅ TEST 2 SUCCESS!`);
  } catch (e) {
    console.error(`❌ TEST 2 FAILED: ${e.message}`);
  }

  // 3. Swap USDC.k -> DNR
  console.log("\n[TEST 3] Swapping USDC.k back to DNR...");
  try {
    const amountInToken = ethers.parseEther("10"); // Approx 10 USDC
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
    const tx3 = await Router.swapTokensForDNR(PAIR, USDCK, amountInToken, 0, wallet.address, deadline, PARAMS);
    await tx3.wait();
    console.log(`✅ TEST 3 SUCCESS!`);
  } catch (e) {
    console.error(`❌ TEST 3 FAILED: ${e.message}`);
  }
}

main().catch(console.error);
