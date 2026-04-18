const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";
  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  
  const balance = await usdckContract.balanceOf(deployer.address);
  console.log(`Address: ${deployer.address}`);
  console.log(`USDC.k Balance: ${ethers.formatUnits(balance, 18)}`);
}

main().catch(console.error);
