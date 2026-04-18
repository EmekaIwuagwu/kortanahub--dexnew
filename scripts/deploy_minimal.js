const { ethers } = require("hardhat");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MinimalRouter...");
    const R = await ethers.deployContract("MinimalRouter", [deployer.address], { gasLimit: 5000000 });
    await R.waitForDeployment();
    console.log("MinimalRouter:", R.target);
}
main().catch(console.error);
