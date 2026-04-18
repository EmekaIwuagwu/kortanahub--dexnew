const { ethers, network } = require("hardhat");

async function main() {
  const usdckAddress = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826"; 
  const contract = await ethers.getContractAt("KORTUSD", usdckAddress);
  
  const fromBlock = 0;
  const logs = await contract.queryFilter(contract.filters.Transfer(), fromBlock, "latest");

  const balances = {};

  logs.forEach((log) => {
    const from = log.args[0];
    const to = log.args[1];
    const value = log.args[2];

    if (from !== ethers.ZeroAddress) {
      balances[from] = (balances[from] || 0n) - value;
    }
    balances[to] = (balances[to] || 0n) + value;
  });

  console.log("\n💰 USDC.k Holders Audit (Balances > 0):\n");
  for (const [addr, bal] of Object.entries(balances)) {
    if (bal > 0n) {
      console.log(`- ${addr}: ${ethers.formatUnits(bal, 18)} USDC.k`);
    }
  }
}

main().catch(console.error);
