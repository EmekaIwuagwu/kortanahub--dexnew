const { ethers } = require("hardhat");

async function main() {
  const masterAddr = "0xC70292a9DC97cF548Fee9839D7696CBAFc951B20";
  console.log(`\n--- 🏛️ KORTANA MAINNET (ZEUS) AUDIT ---`);
  
  // Use Mainnet Provider
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  
  const balance = await provider.getBalance(masterAddr);
  console.log(`Address: ${masterAddr}`);
  console.log(`Native DNR (Gas): ${ethers.formatUnits(balance, 18)} DNR`);

  // We also check for the 200M DNR tokens (assuming it's an ERC20 on Mainnet)
  // If DNR is Native only, then the balance above covers it.
}

main().catch(console.error);
