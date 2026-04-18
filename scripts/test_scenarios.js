const { ethers } = require("hardhat");

async function main() {
    const [deployer, user1, user2] = await ethers.getSigners();
    
    console.log("=========================================");
    console.log("   🚀 KORTANA DEX: E2E SCENARIO TEST   ");
    console.log("=========================================\n");

    // 1. DEPLOYMENT
    console.log("--- DEPLOYING CONTRACTS ---");
    const WDNR = await ethers.deployContract("WDNR");
    await WDNR.waitForDeployment();
    
    const Factory = await ethers.deployContract("KortanaFactory", [deployer.address]);
    await Factory.waitForDeployment();
    
    const Router = await ethers.deployContract("KortanaRouter", [Factory.target, WDNR.target]);
    await Router.waitForDeployment();
    
    const KORTUSD = await ethers.deployContract("KORTUSD", [deployer.address]);
    await KORTUSD.waitForDeployment();

    // Create pair first so Oracle can initialize
    await Factory.createPair(WDNR.target, KORTUSD.target);
    const poolAddress = await Factory.pairFor(WDNR.target, KORTUSD.target);

    // Deploy Oracle with the real pair
    const Oracle = await ethers.deployContract("KortanaOracle", [poolAddress]);
    await Oracle.waitForDeployment();

    const Stabilizer = await ethers.deployContract("KortanaStabilizer", [
        KORTUSD.target,
        Oracle.target,
        WDNR.target,
        deployer.address
    ]);
    await Stabilizer.waitForDeployment();

    const Bridge = await ethers.deployContract("KortanaBridgeSource");
    await Bridge.waitForDeployment();

    // Grant roles
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
    await KORTUSD.grantRole(MINTER_ROLE, Stabilizer.target);
    await KORTUSD.grantRole(BURNER_ROLE, Stabilizer.target);
    await Bridge.addSupportedToken(KORTUSD.target);
    await Bridge.addSupportedToken(WDNR.target);

    console.log("✅ All Contracts Deployed Successfully!\n");

    // ==========================================
    // SCENARIO 1: MINT KORTUSD VIA STABILIZER
    // ==========================================
    console.log("--- SCENARIO 1: MINT KORTUSD ---");
    const depositAmount = ethers.parseEther("1000"); // 1000 DNR

    // Wrap some DNR into WDNR
    await WDNR.connect(user1).deposit({ value: depositAmount });
    await WDNR.connect(user1).approve(Stabilizer.target, depositAmount);
    
    console.log(`User1 deposited and wrapped ${ethers.formatEther(depositAmount)} DNR.`);

    // Set a manual oracle price for bootstrapping: 1 WDNR = $2.00
    await Oracle.setManualPrices(ethers.parseEther("2.0"), ethers.parseEther("1.0"));

    // Mint KORTUSD (80% collateral ratio means 1000 WDNR @ $2 = $2000 total col value = 2500 KORTUSD max)
    // Wait, if ratio is 80%, 1000 DNR ($2000) allows minting 2000 / 0.8 = 2500 KORTUSD.
    // Let's see the contract: kortusdToMint = collateralAmount * price * 10000 / (1e18 * collateralRatio)
    await Stabilizer.connect(user1).mint(depositAmount, 0);
    
    let user1KortusdBalance = await KORTUSD.balanceOf(user1.address);
    console.log(`✅ User1 Minted: ${ethers.formatEther(user1KortusdBalance)} KORTUSD (Using ${ethers.formatEther(depositAmount)} WDNR as collateral)\n`);


    // ==========================================
    // SCENARIO 2: PROVIDE LIQUIDITY (DNR/KORTUSD)
    // ==========================================
    console.log("--- SCENARIO 2: LIQUIDITY (POOL) ---");
    // User1 will provide 500 DNR and 1000 KORTUSD to create the pool
    
    const dnrLiq = ethers.parseEther("500");
    const kortusdLiq = ethers.parseEther("1000");

    await KORTUSD.connect(user1).approve(Router.target, kortusdLiq);
    
    const tx = await Router.connect(user1).addLiquidityDNR(
        KORTUSD.target,
        kortusdLiq,
        0, 0,
        user1.address,
        Math.floor(Date.now() / 1000) + 3600,
        { value: dnrLiq }
    );
    const receipt = await tx.wait();
    console.log(`   Gas Used for addLiquidity (incl. createPair): ${receipt.gasUsed.toString()}`);
    
    const pairAddress = await Factory.pairFor(WDNR.target, KORTUSD.target);
    const Pair = await ethers.getContractAt("KortanaPair", pairAddress);
    let reserves = await Pair.getReserves();
    
    console.log(`✅ Pool Created! Address: ${pairAddress}`);
    console.log(`   Reserves: ${ethers.formatEther(reserves[0])} and ${ethers.formatEther(reserves[1])}\n`);

    // ==========================================
    // SCENARIO 3: BUY KORTUSD WITH DNR
    // ==========================================
    console.log("--- SCENARIO 3: BUY KORTUSD WITH DNR (Decreases DNR Price) ---");
    const buyDnrAmount = ethers.parseEther("50");
    await Router.connect(user2).swapExactDNRForTokens(
        0,
        [WDNR.target, KORTUSD.target],
        user2.address,
        Math.floor(Date.now() / 1000) + 3600,
        { value: buyDnrAmount }
    );

    let user2KortusdBalance = await KORTUSD.balanceOf(user2.address);
    reserves = await Pair.getReserves();
    console.log(`✅ User2 swapped 50 DNR for ${ethers.formatEther(user2KortusdBalance)} KORTUSD`);
    
    // We deterministically sort tokens to find out which reserve is which
    let token0 = await Pair.token0();
    let dnrReserve = token0 === WDNR.target ? reserves[0] : reserves[1];
    let kortusdReserve = token0 === WDNR.target ? reserves[1] : reserves[0];
    
    // Price = KORTUSD Reserve / DNR Reserve
    let currentDnrPrice = (Number(ethers.formatEther(kortusdReserve)) / Number(ethers.formatEther(dnrReserve))).toFixed(4);
    console.log(`   📊 New Price: 1 DNR = ${currentDnrPrice} KORTUSD\n`);

    // ==========================================
    // SCENARIO 4: SELL KORTUSD TO INCREASE DNR PRICE
    // ==========================================
    console.log("--- SCENARIO 4: SELL KORTUSD (Increases DNR value!) ---");
    // User2 sells ALL their KORTUSD back for DNR
    await KORTUSD.connect(user2).approve(Router.target, user2KortusdBalance);
    await Router.connect(user2).swapExactTokensForTokens(
        user2KortusdBalance,
        0,
        [KORTUSD.target, WDNR.target],
        user2.address,
        Math.floor(Date.now() / 1000) + 3600
    );

    reserves = await Pair.getReserves();
    dnrReserve = token0 === WDNR.target ? reserves[0] : reserves[1];
    kortusdReserve = token0 === WDNR.target ? reserves[1] : reserves[0];
    currentDnrPrice = (Number(ethers.formatEther(kortusdReserve)) / Number(ethers.formatEther(dnrReserve))).toFixed(4);
    console.log(`✅ User2 Sold KORTUSD back to pool!`);
    console.log(`   📈 The price of DNR Increased! 1 DNR = ${currentDnrPrice} KORTUSD\n`);

    // ==========================================
    // SCENARIO 5: BRIDGE KORTUSD TO DESTINATION
    // ==========================================
    console.log("--- SCENARIO 5: BRIDGE ---");
    const bridgeAmount = ethers.parseEther("100");
    await KORTUSD.connect(user1).approve(Bridge.target, bridgeAmount);
    await Bridge.connect(user1).lockTokens(
        KORTUSD.target,
        bridgeAmount,
        56, // Destination ChainID (BSC)
        user1.address,
        { value: ethers.parseEther("0.001") } // Bridge Fee in DNR
    );
    console.log(`✅ User1 locked and bridged 100 KORTUSD efficiently!\n`);

    // ==========================================
    // SCENARIO 6: ANALYTICS & SUMMARY
    // ==========================================
    console.log("--- SCENARIO 6: FINAL ANALYTICS ---");
    let totalDnrValueLocked = await ethers.provider.getBalance(Stabilizer.target);
    totalDnrValueLocked += await WDNR.balanceOf(Stabilizer.target);
    totalDnrValueLocked += await WDNR.balanceOf(pairAddress);

    console.log(`📊 Kortana DEX TVL (DNR Locked): ${ethers.formatEther(totalDnrValueLocked)} DNR`);
    console.log(`📊 Total KORTUSD in Circulation: ${ethers.formatEther(await KORTUSD.totalSupply())} KORTUSD`);
    console.log(`📊 DNR Pool Price: ${currentDnrPrice} KORTUSD`);
    console.log("=========================================\n");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
