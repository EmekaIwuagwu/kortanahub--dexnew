const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const ATOMIC_ROUTER = "0xAd2d54DFD50d694a489A01F761667f55F579C1cc";
  const PAIR = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";
  const USDCK = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const Router = await ethers.getContractAt("KortanaAtomicRouter", ATOMIC_ROUTER, wallet);
  const Token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDCK, wallet);

  // KEY: GAS PRICE 1, TYPE 0, HIGH GAS LIMIT
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 10000000 };
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  console.log(`\n--- 🧪 ULTIMATE SUCCESS VERIFICATION ---`);

  // 1. Buy USDC.k (DNR -> USDC.k)
  console.log("[TEST 1] Buying USDC.k...");
  try {
    const tx1 = await Router.swapDNRForTokens(PAIR, 0, wallet.address, deadline, { ...PARAMS, value: ethers.parseEther("0.1") });
    console.log(`Hash: ${tx1.hash}`);
    const r1 = await tx1.wait();
    console.log(`✅ SUCCESS: ${tx1.hash}`);
  } catch (e) {
    console.error(`❌ FAILED: ${e.message}`);
  }

  // 2. Sell USDC.k (USDC.k -> DNR)
  console.log("\n[TEST 2] Selling USDC.k...");
  try {
    console.log("Approving...");
    await (await Token.approve(ATOMIC_ROUTER, ethers.parseEther("10"), PARAMS)).wait();
    const tx2 = await Router.swapTokensForDNR(PAIR, USDCK, ethers.parseEther("10"), 0, wallet.address, deadline, PARAMS);
    console.log(`Hash: ${tx2.hash}`);
    const r2 = await tx2.wait();
    console.log(`✅ SUCCESS: ${tx2.hash}`);
  } catch (e) {
    console.error(`❌ FAILED: ${e.message}`);
  }
}

main().catch(console.error);
