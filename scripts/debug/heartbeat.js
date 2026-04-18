const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`🚀 HEARTBEAT CHECK...`);
  console.log(`Address: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatUnits(balance, 18)} DNR`);

  const tx = await deployer.sendTransaction({
    to: "0x000000000000000000000000000000000000dEaD",
    value: ethers.parseUnits("1.0", 18),
    type: 0
  });

  console.log("⏳ Waiting for heartbeat confirmation...");
  const receipt = await tx.wait();
  console.log(`✅ HEARTBEAT SUCCESS! Tx: ${receipt.hash}`);
}

main().catch(console.error);
