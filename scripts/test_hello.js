const { ethers } = require("hardhat");
async function main() {
    console.log("Deploying HelloWorld...");
    const HelloWorld = await ethers.deployContract("HelloWorld", ["Hello Kortana"], { gasLimit: 1000000 });
    await HelloWorld.waitForDeployment();
    console.log("Deployed:", HelloWorld.target);
}
main().catch(console.error);
