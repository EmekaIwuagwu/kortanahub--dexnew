const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Analyzing Deployer Config...");
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} DNR`);
    
    const factoryFactory = await ethers.getContractFactory("KortanaFactory");
    console.log(`KortanaFactory Bytecode Length: ${factoryFactory.bytecode.length} chars (${factoryFactory.bytecode.length / 2} bytes)`);

    console.log("\nAttempting explicit deployment...");

    try {
        // Fetch optimal network fee data
        const feeData = await ethers.provider.getFeeData();
        console.log(`Network GasPrice: ${feeData.gasPrice?.toString()} wei`);

        // Use custom explicit parameters
        const overrides = {
            gasLimit: 5000000, 
            gasPrice: feeData.gasPrice || ethers.parseUnits("10", "gwei")
        };
        
        console.log("Deploying WDNR...");
        const WDNR = await ethers.deployContract("WDNR", [], overrides);
        await WDNR.waitForDeployment();
        console.log(`WDNR Address: ${WDNR.target}`);

        console.log("Deploying KortanaFactory...");
        const Factory = await ethers.deployContract("KortanaFactory", [deployer.address], overrides);
        await Factory.waitForDeployment();
        console.log(`Factory Address: ${Factory.target}`);
        
        console.log("\n✅ Debug Deployment Successful!");
    } catch(err) {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error("Reason:", err.reason);
        console.error("Message:", err.message);
        if (err.receipt) {
            console.error("Gas Used:", err.receipt.gasUsed?.toString());
            console.error("Status:", err.receipt.status);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
