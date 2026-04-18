const { ethers } = require("hardhat");

async function main() {
  const masterAddr = "0xC70292a9DC97cF548Fee9839D7696CBAFc951B20";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  
  console.log(`\n--- 🕵️ GENESIS DISCOVERY ---`);
  
  // Check the current nonce
  const nonce = await provider.getTransactionCount(masterAddr);
  console.log(`Current Nonce: ${nonce}`);

  // Fetch the last 5 transactions (mock logic since ethers doesn't have a direct getHistory for custom RPCs usually)
  // We will check the current balance of common contract deployments
  
  // We already know the previous Factory was 0x4bD4cc857bBa632dc6fd4F9818197CBfC67EFC19
  // Let's check for its successors.
}

main().catch(console.error);
