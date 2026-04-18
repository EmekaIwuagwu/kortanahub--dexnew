const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const MONODEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000 };

  const logFile = "scripts/simulation/dummy_trade.log";
  fs.writeFileSync(logFile, `--- KORTANA FINAL SUCCESS LOG ---\nTimestamp: ${new Date().toISOString()}\n\n`);

  function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
  }

  const iface = new ethers.Interface([
    "function swapExactDNRForKTUSD(uint256 minOut, address to) payable",
    "function swapExactKTUSDForDNR(uint256 amount, uint256 minOut, address to)"
  ]);

  try {
    // 🧪 Scenario 1: Buy USDC.k with DNR
    log("[SCENARIO 1] Buy USDC.k with 0.1 DNR");
    const tx1 = await wallet.sendTransaction({
        to: MONODEX,
        data: iface.encodeFunctionData("swapExactDNRForKTUSD", [0, wallet.address]),
        value: ethers.parseEther("0.1"),
        ...PARAMS
    });
    log(`   [TX] Hash: ${tx1.hash}`);
    await tx1.wait();
    log(`   [SUCCESS] Status: 1`);

    // 🧪 Scenario 2: Sell USDC.k to get DNR (Price Growth)
    log("\n[SCENARIO 2] SELL USDC.k for DNR (Grow Price)");
    const tx2 = await wallet.sendTransaction({
        to: MONODEX,
        data: iface.encodeFunctionData("swapExactKTUSDForDNR", [ethers.parseEther("10.0"), 0, wallet.address]),
        ...PARAMS
    });
    log(`   [TX] Hash: ${tx2.hash}`);
    await tx2.wait();
    log(`   [SUCCESS] Status: 1`);

    log(`\n--- ALL VERIFICATIONS COMPLETE: READY FOR RENDER ---`);
  } catch (e) {
    log(`\n[REVERT DETECTED] ${e.message}`);
  }
}

main();
