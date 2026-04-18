/**
 * Quick test: Deploy just the Oracle to Poseidon Testnet
 * to debug the deployment failure.
 */
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const pairAddr = "0x4B4a3aC507832835bA5C8fBdE33c7e57918c6711";
    
    // Method 1: getContractFactory + deploy with explicit overrides
    console.log("\n--- Attempting Oracle deploy via ContractFactory ---");
    const OracleFactory = await ethers.getContractFactory("KortanaOracle");
    console.log("Bytecode length:", OracleFactory.bytecode.length / 2 - 1, "bytes");
    
    try {
        const oracle = await OracleFactory.deploy(pairAddr, {
            gasLimit: 500000,
            gasPrice: 10000000000n,
            type: 0
        });
        console.log("Deploy tx hash:", oracle.deploymentTransaction().hash);
        await oracle.waitForDeployment();
        console.log("✅ Oracle deployed at:", oracle.target);
        
        // Test it
        await (await oracle.setManualPrices(
            ethers.parseEther("2.0"), 
            ethers.parseEther("1.0"),
            { gasLimit: 100000, gasPrice: 10000000000n, type: 0 }
        )).wait();
        const cp = await oracle.getCollateralPrice();
        console.log("Collateral price:", ethers.formatEther(cp));
        console.log("✅ Oracle working!");
    } catch (e) {
        console.error("❌ Failed:", e.shortMessage || e.message.split("\n")[0]);
        
        // Method 2: try with lower gas
        console.log("\n--- Retry with gasLimit 200000 ---");
        try {
            const oracle2 = await OracleFactory.deploy(pairAddr, {
                gasLimit: 200000,
                gasPrice: 10000000000n,
                type: 0
            });
            console.log("Deploy tx hash:", oracle2.deploymentTransaction().hash);
            await oracle2.waitForDeployment();
            console.log("✅ Oracle deployed at:", oracle2.target);
        } catch (e2) {
            console.error("❌ Also failed:", e2.shortMessage || e2.message.split("\n")[0]);
        }
    }
}

main().catch(console.error);
