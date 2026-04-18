const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const configPath = path.join(__dirname, "../config/kortanaTestnet.json");
    const testnetConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const { contracts } = testnetConfig;

    const [deployer] = await ethers.getSigners();
    console.log("Starting full Metamask-style Atomic Bootstrapping...");

    const overrides = { gasLimit: 8000000n, gasPrice: 10000000000n, type: 0 };
    
    // 1. Redeploy Pair (raw style)
    console.log("1. Deploying Pair via raw tx...");
    const PairFactory = await ethers.getContractFactory("KortanaPair");
    const deployTx = await deployer.sendTransaction({
        data: PairFactory.bytecode,
        ...overrides
    });
    console.log(`   Sent Tx Hash: ${deployTx.hash}`);
    const receipt = await deployTx.wait();
    console.log(`   ✅ Pair Deployed at: ${receipt.contractAddress}`);
    
    contracts.pair = receipt.contractAddress;
    testnetConfig.contracts = contracts;
    fs.writeFileSync(configPath, JSON.stringify(testnetConfig, null, 2));

    const Pair = await ethers.getContractAt("KortanaPair", contracts.pair);

    // 2. Initialize Pair
    console.log("2. Initializing Pair via raw tx...");
    const initData = Pair.interface.encodeFunctionData("initialize", [contracts.WDNR, contracts.kortusd]);
    const initTx = await deployer.sendTransaction({
        to: contracts.pair,
        data: initData,
        ...overrides
    });
    await initTx.wait();
    console.log("   ✅ Initialized Pair.");

    // 3. Register Pair in Factory
    console.log("3. Registering Pair in Factory via raw tx...");
    const Factory = await ethers.getContractAt("KortanaFactory", contracts.factory);
    const regData = Factory.interface.encodeFunctionData("registerPair", [contracts.WDNR, contracts.kortusd, contracts.pair]);
    const regTx = await deployer.sendTransaction({
        to: contracts.factory,
        data: regData,
        ...overrides
    });
    await regTx.wait();
    console.log("   ✅ Registered Pair in Factory.");

    console.log("\n🎉 Atomic Bootstrapping Complete. Ready for Scenarios!");
}

main().catch(console.error);
