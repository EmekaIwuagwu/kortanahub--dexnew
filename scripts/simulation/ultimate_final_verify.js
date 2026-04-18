const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const DEX_ADDR = "0xA3841F17121EBBc98b07068b0462C4Fa44Dc8a42";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000 };

  const iface = new ethers.Interface([
    "function swapExactDNRForKTUSD(uint256 minOut, address to) payable",
    "function swapExactKTUSDForDNR(uint256 amount, uint256 minOut, address to)"
  ]);

  console.log("--- 🏛️ KORTANA FINAL INSTITUTIONAL AUDIT ---");

  // 🧪 Scenario 3 (First): Buy USDC.k with DNR (ENTRY SUCCESS)
  try {
    console.log("\n[SCENARIO] Buy USDC.k with DNR (Entry Check)");
    const txEntry = await wallet.sendTransaction({
        to: DEX_ADDR,
        data: iface.encodeFunctionData("swapExactDNRForKTUSD", [0, wallet.address]),
        value: ethers.parseEther("0.01"),
        ...PARAMS
    });
    console.log(`   TX Hash: ${txEntry.hash}`);
    const rEntry = await txEntry.wait();
    console.log(`   BLOCK: ${rEntry.blockNumber} | STATUS: ${rEntry.status === 1 ? '✅ SUCCESS' : '❌ REVERT'}`);
  } catch (e) {
    console.log(`   ERROR: ${e.message}`);
  }

  // 🧪 Scenario 1 & 2: Buy DNR with USDC.k (PRICE GROWTH / EXIT)
  try {
    console.log("\n[SCENARIO] Buy DNR with USDC.k (Price Growth Check)");
    // Using 0.1 ktUSD for the test
    const txExit = await wallet.sendTransaction({
        to: DEX_ADDR,
        data: iface.encodeFunctionData("swapExactKTUSDForDNR", [ethers.parseEther("0.1"), 0, wallet.address]),
        ...PARAMS
    });
    console.log(`   TX Hash: ${txExit.hash}`);
    const rExit = await txExit.wait();
    console.log(`   BLOCK: ${rExit.blockNumber} | STATUS: ${rExit.status === 1 ? '✅ SUCCESS' : '❌ REVERT'}`);
  } catch (e) {
    console.log(`   ERROR: ${e.message}`);
  }

  console.log("\n--- AUDIT COMPLETE ---");
}

main().catch(console.error);
