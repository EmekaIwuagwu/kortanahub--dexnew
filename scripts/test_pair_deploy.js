const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const tokenA = "0xe82c92488B4fA901524101e535E9C9E96a3554b2"; // WDNR
    const tokenB = "0xE856fd033532F1A01dC3e0CAB3Bd586a7Cbb11A0"; // KORTUSD
    
    console.log("Deploying KortanaPair directly...");
    const Pair = await ethers.deployContract("KortanaPair", [tokenA, tokenB], { gasLimit: 5000000 });
    await Pair.waitForDeployment();
    console.log(`Pair Deployed: ${Pair.target}`);
}

main().catch(console.error);
