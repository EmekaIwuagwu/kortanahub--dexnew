const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`🧪 Starting Live Test Scenarios on Testnet...`);
    console.log(`   Tester Address: ${deployer.address}`);

    const configPath = path.join(__dirname, "../config/kortanaTestnet.json");
    const { contracts } = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Attach to deployed contracts
    const Kortusd = await ethers.getContractAt("KORTUSD", contracts.kortusd);
    const WDNR = await ethers.getContractAt("WDNR", contracts.WDNR);
    const LiquidityManager = await ethers.getContractAt("KortanaLiquidityManager", contracts.liquidityManager);
    const SwapDNR = await ethers.getContractAt("KortanaSwapDNR", contracts.swapDNR);
    const SwapTokens = await ethers.getContractAt("KortanaSwapTokens", contracts.swapTokens);
    const Pair = await ethers.getContractAt("KortanaPair", contracts.pair);

    // Some overrides to ensure transaction stability on testnet
    const overrides = { gasLimit: 8000000, gasPrice: 10000000000n, type: 0 };
    
    try {
        console.log("\n[1/6] 💸 Minting KORTUSD for testing...");
        // In the absence of a live Stabilizer contract from the partial deploy, we grant MINTER_ROLE to ourself
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const hasRole = await Kortusd.hasRole(MINTER_ROLE, deployer.address);
        if (!hasRole) {
            console.log("      Granting MINTER_ROLE to self...");
            let txRole = await Kortusd.grantRole(MINTER_ROLE, deployer.address, overrides);
            await txRole.wait();
        }
        
        const mintAmount = ethers.parseEther("100000"); // 100,000 KORTUSD
        let txMint = await Kortusd.mint(deployer.address, mintAmount, overrides);
        await txMint.wait();
        console.log(`      ✅ Minted 100,000 KORTUSD successfully.`);
        
        console.log("\n[2/6] 💧 Providing Liquidity (Pool DNR/KORTUSD)...");
        // We need to approve the Liquidity Manager to spend our KORTUSD
        let txAppr1 = await Kortusd.approve(contracts.liquidityManager, ethers.MaxUint256, overrides);
        await txAppr1.wait();
        console.log("      Approved LiquidityManager to spend KORTUSD.");

        const dnrAmount = ethers.parseEther("20");     // 20 DNR
        const usdAmount = ethers.parseEther("10000");  // 10,000 KORTUSD ~ assuming 1 DNR = $500 roughly in test pool
        let txAddLiq = await LiquidityManager.addLiquidityDNR(
            contracts.kortusd,
            usdAmount,
            0,
            0,
            deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 20, // 20 min deadline
            { value: dnrAmount, ...overrides }
        );
        await txAddLiq.wait();
        console.log(`      ✅ Added 20 DNR and 10,000 KORTUSD to liquidity pool.`);

        console.log("\n[3/6] 📊 Analytics: Querying Initial Pool Reserves...");
        let [res0, res1] = await Pair.getReserves();
        console.log(`      Current Pair Reserves:`);
        console.log(`      Reserve 0: ${ethers.formatEther(res0)}`);
        console.log(`      Reserve 1: ${ethers.formatEther(res1)}`);

        console.log("\n[4/6] 🛒 Swap: Buying KORTUSD with DNR (Increasing KORTUSD price)...");
        // Swap DNR to KORTUSD
        const dnrSwapAmount = ethers.parseEther("5");
        let txBuy = await SwapDNR.swapExactDNRForTokens(
            0,
            [contracts.WDNR, contracts.kortusd], 
            deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            { value: dnrSwapAmount, ...overrides }
        );
        await txBuy.wait();
        console.log(`      ✅ Successfully swapped 5 DNR for KORTUSD.`);

        console.log("\n[5/6] 📈 Swap: Selling KORTUSD to increase the value of DNR...");
        // Approve SwapTokens to spend KORTUSD
        let txAppr2 = await Kortusd.approve(contracts.swapTokens, ethers.MaxUint256, overrides);
        await txAppr2.wait();
        
        const usdSwapAmount = ethers.parseEther("1000");
        let txSell = await SwapTokens.swapExactTokensForDNR(
            usdSwapAmount,
            0,
            [contracts.kortusd, contracts.WDNR],
            deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            overrides
        );
        await txSell.wait();
        console.log(`      ✅ Successfully sold 1,000 KORTUSD for DNR.`);

        console.log("\n[6/6] 📊 Analytics: Querying Final Pool Reserves (Price Impact)...");
        let [fRes0, fRes1] = await Pair.getReserves();
        console.log(`      Final Pair Reserves:`);
        console.log(`      Reserve 0: ${ethers.formatEther(fRes0)}`);
        console.log(`      Reserve 1: ${ethers.formatEther(fRes1)}`);
        
        console.log("\n[Note on Bridge, Farm, and Stabilizer]");
        console.log("   -> These extended architecture components require the AMM stabilization to complete first.");
        console.log("   -> They hit testnet node limits during full batch deployment and will be deployed as separate modules after frontend AMM integration.");
        
        console.log("\n🎉 ALL CORE DEX SCENARIOS PASSED WITH FLYING COLORS!");

    } catch (e) {
        console.error("\n❌ SCENARIO FAILED!");
        console.error("Reason:", e.shortMessage || e.message.split("\n")[0]);
    }
}

main().catch(console.error);
