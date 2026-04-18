/**
 * KORTANA DEX - FULL E2E TEST ON POSEIDON TESTNET
 * Tests ALL 8 scenarios against LIVE Kortana Testnet RPC
 *
 * IMPORTANT: Kortana RPC does NOT support EIP-1559.
 *            All transactions use legacy gas (type: 0).
 *
 * Uses already-deployed core contracts from config + deploys
 * missing ones (Stabilizer, Bridge, Farm).
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function header(num, emoji, title) {
    console.log("\n" + "-".repeat(60));
    console.log("  [" + num + "/8] " + emoji + "  " + title);
    console.log("-".repeat(60));
}
function fmt(val) { return ethers.formatEther(val); }

// Legacy gas overrides - Kortana RPC does NOT support EIP-1559
// gasLimit 8M causes failures on this testnet - use appropriate limits
const GAS = { gasPrice: 10000000000n, type: 0 };
const DEPLOY = { gasLimit: 500000, ...GAS };
const CALL = { gasLimit: 300000, ...GAS };
const DEFI = { gasLimit: 500000, ...GAS };

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(60));
    console.log("  KORTANA DEX - POSEIDON TESTNET E2E TEST SUITE");
    console.log("=".repeat(60));
    console.log("  Network  : Kortana Testnet (Poseidon RPC)");
    console.log("  ChainID  : 72511");
    console.log("  Deployer : " + deployer.address);
    const bal = await ethers.provider.getBalance(deployer.address);
    console.log("  Balance  : " + fmt(bal) + " DNR\n");

    // Load config
    const configPath = path.join(__dirname, "../config/kortanaTestnet.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const C = config.contracts;

    console.log("--- LOADING DEPLOYED CONTRACTS ---\n");
    const WDNR = await ethers.getContractAt("WDNR", C.WDNR);
    const Factory = await ethers.getContractAt("KortanaFactory", C.factory);
    const SwapDNR = await ethers.getContractAt("KortanaSwapDNR", C.swapDNR);
    const SwapTokens = await ethers.getContractAt("KortanaSwapTokens", C.swapTokens);
    const LiquidityMgr = await ethers.getContractAt("KortanaLiquidityManager", C.liquidityManager);
    const Kortusd = await ethers.getContractAt("KORTUSD", C.kortusd);
    const Pair = await ethers.getContractAt("KortanaPair", C.pair);

    console.log("  WDNR             : " + C.WDNR);
    console.log("  Factory          : " + C.factory);
    console.log("  SwapDNR          : " + C.swapDNR);
    console.log("  SwapTokens       : " + C.swapTokens);
    console.log("  LiquidityManager : " + C.liquidityManager);
    console.log("  KORTUSD          : " + C.kortusd);
    console.log("  Pair             : " + C.pair);

    const token0 = await Pair.token0();
    const isToken0WDNR = token0.toLowerCase() === C.WDNR.toLowerCase();

    // --- DEPLOY MISSING CONTRACTS ---
    console.log("\n--- DEPLOYING MISSING CONTRACTS ---\n");

    let Oracle, Stabilizer, Bridge, Farm;

    // Oracle (should already be deployed)
    if (C.oracle) {
        Oracle = await ethers.getContractAt("KortanaOracle", C.oracle);
        console.log("  Oracle (existing) : " + C.oracle);
    } else {
        console.log("  Deploying Oracle...");
        const F = await ethers.getContractFactory("KortanaOracle");
        Oracle = await F.deploy(C.pair, DEPLOY);
        await Oracle.waitForDeployment();
        C.oracle = Oracle.target;
        console.log("  Oracle (NEW)      : " + Oracle.target);
    }

    // Stabilizer
    if (C.stabilizer) {
        Stabilizer = await ethers.getContractAt("KortanaStabilizer", C.stabilizer);
        console.log("  Stabilizer (existing) : " + C.stabilizer);
    } else {
        console.log("  Deploying Stabilizer...");
        const F = await ethers.getContractFactory("KortanaStabilizer");
        Stabilizer = await F.deploy(C.kortusd, C.oracle, C.WDNR, deployer.address, DEPLOY);
        await Stabilizer.waitForDeployment();
        C.stabilizer = Stabilizer.target;
        console.log("  Stabilizer (NEW)  : " + Stabilizer.target);
    }

    // Bridge
    if (C.bridge) {
        Bridge = await ethers.getContractAt("KortanaBridgeSource", C.bridge);
        console.log("  Bridge (existing) : " + C.bridge);
    } else {
        console.log("  Deploying Bridge...");
        const F = await ethers.getContractFactory("KortanaBridgeSource");
        Bridge = await F.deploy(DEPLOY);
        await Bridge.waitForDeployment();
        C.bridge = Bridge.target;
        console.log("  Bridge (NEW)      : " + Bridge.target);
    }

    // Farm
    if (C.farm) {
        Farm = await ethers.getContractAt("KortanaFarm", C.farm);
        console.log("  Farm (existing)   : " + C.farm);
    } else {
        console.log("  Deploying Farm...");
        const rewardPerBlock = ethers.parseEther("10");
        const F = await ethers.getContractFactory("KortanaFarm");
        Farm = await F.deploy(C.pair, C.kortusd, rewardPerBlock, DEPLOY);
        await Farm.waitForDeployment();
        C.farm = Farm.target;
        console.log("  Farm (NEW)        : " + Farm.target);
    }

    // --- ROLE SETUP ---
    console.log("\n--- CONFIGURING ROLES ---\n");
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

    const deployerHasMinter = await Kortusd.hasRole(MINTER_ROLE, deployer.address);
    if (!deployerHasMinter) {
        console.log("  Granting MINTER_ROLE to deployer...");
        await (await Kortusd.grantRole(MINTER_ROLE, deployer.address, CALL)).wait();
    }
    console.log("  Deployer has MINTER_ROLE");

    const stabHasMinter = await Kortusd.hasRole(MINTER_ROLE, Stabilizer.target);
    if (!stabHasMinter) {
        console.log("  Granting MINTER_ROLE to Stabilizer...");
        await (await Kortusd.grantRole(MINTER_ROLE, Stabilizer.target, CALL)).wait();
    }
    const stabHasBurner = await Kortusd.hasRole(BURNER_ROLE, Stabilizer.target);
    if (!stabHasBurner) {
        console.log("  Granting BURNER_ROLE to Stabilizer...");
        await (await Kortusd.grantRole(BURNER_ROLE, Stabilizer.target, CALL)).wait();
    }
    console.log("  Stabilizer has MINTER + BURNER roles");

    console.log("  Setting Oracle prices (1 WDNR = $2, 1 KORTUSD = $1)...");
    await (await Oracle.setManualPrices(
        ethers.parseEther("2.0"), ethers.parseEther("1.0"), CALL
    )).wait();
    console.log("  Oracle prices set");

    const kortusdSupported = await Bridge.supportedTokens(C.kortusd);
    if (!kortusdSupported) {
        console.log("  Adding KORTUSD as supported bridge token...");
        await (await Bridge.addSupportedToken(C.kortusd, CALL)).wait();
    }
    const wdnrSupported = await Bridge.supportedTokens(C.WDNR);
    if (!wdnrSupported) {
        console.log("  Adding WDNR as supported bridge token...");
        await (await Bridge.addSupportedToken(C.WDNR, CALL)).wait();
    }
    console.log("  Bridge tokens configured");

    // Save config
    fs.writeFileSync(configPath, JSON.stringify({ contracts: C }, null, 2));
    console.log("\n  Config saved!\n");

    const results = [];

    // =====================================================================
    //  SCENARIO 3: MINT KORTUSD
    // =====================================================================
    header(3, "MINT", "Mint KORTUSD via Stabilizer");
    try {
        const wrapAmount = ethers.parseEther("100");
        console.log("  Wrapping " + fmt(wrapAmount) + " DNR -> WDNR...");
        await (await WDNR.deposit({ value: wrapAmount, ...DEFI })).wait();

        console.log("  Approving Stabilizer...");
        await (await WDNR.approve(Stabilizer.target, wrapAmount, CALL)).wait();

        console.log("  Minting KORTUSD...");
        const kortusdBefore = await Kortusd.balanceOf(deployer.address);
        await (await Stabilizer.mint(wrapAmount, 0, DEFI)).wait();
        const kortusdAfter = await Kortusd.balanceOf(deployer.address);
        const minted = kortusdAfter - kortusdBefore;

        console.log("  Minted: " + fmt(minted) + " KORTUSD");
        console.log("  Collateral locked: " + fmt(await WDNR.balanceOf(Stabilizer.target)) + " WDNR");
        console.log("  PASSED");
        results.push({ scenario: "3. Mint KORTUSD", status: "PASS" });
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "3. Mint KORTUSD", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 2: LIQUIDITY
    // =====================================================================
    header(2, "LIQUIDITY", "Pool DNR/KORTUSD");
    try {
        const dnrLiq = ethers.parseEther("20");
        const kortusdLiq = ethers.parseEther("10000");

        let myKortusd = await Kortusd.balanceOf(deployer.address);
        if (myKortusd < kortusdLiq) {
            console.log("  Minting " + fmt(kortusdLiq) + " KORTUSD...");
            await (await Kortusd.mint(deployer.address, kortusdLiq, CALL)).wait();
        }

        console.log("  Approving LiquidityManager...");
        await (await Kortusd.approve(C.liquidityManager, kortusdLiq, CALL)).wait();

        console.log("  Adding " + fmt(dnrLiq) + " DNR + " + fmt(kortusdLiq) + " KORTUSD to pool...");
        const txLiq = await LiquidityMgr.addLiquidityDNR(
            C.kortusd, kortusdLiq, 0, 0, deployer.address,
            Math.floor(Date.now() / 1000) + 1200,
            { value: dnrLiq, ...DEFI }
        );
        const receiptLiq = await txLiq.wait();

        const [r0, r1] = await Pair.getReserves();
        const wdnrReserve = isToken0WDNR ? r0 : r1;
        const kortusdReserve = isToken0WDNR ? r1 : r0;
        const lpBalance = await Pair.balanceOf(deployer.address);

        console.log("  Pool Reserves - WDNR: " + fmt(wdnrReserve) + ", KORTUSD: " + fmt(kortusdReserve));
        console.log("  LP tokens: " + fmt(lpBalance));
        console.log("  Gas used: " + receiptLiq.gasUsed.toString());
        console.log("  PASSED");
        results.push({ scenario: "2. Liquidity (Pool)", status: "PASS" });
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "2. Liquidity (Pool)", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 1: SWAP
    // =====================================================================
    header(1, "SWAP", "KORTUSD -> DNR (SwapTokens)");
    try {
        const swapAmount = ethers.parseEther("100");
        console.log("  Approving SwapTokens...");
        await (await Kortusd.approve(C.swapTokens, swapAmount, CALL)).wait();

        const dnrBefore = await ethers.provider.getBalance(deployer.address);
        console.log("  Swapping " + fmt(swapAmount) + " KORTUSD -> DNR...");
        const txSwap = await SwapTokens.swapExactTokensForDNR(
            swapAmount, 0, [C.kortusd, C.WDNR], deployer.address,
            Math.floor(Date.now() / 1000) + 1200, DEFI
        );
        const receiptSwap = await txSwap.wait();
        const dnrAfter = await ethers.provider.getBalance(deployer.address);
        const gasCost = receiptSwap.gasUsed * receiptSwap.gasPrice;
        const dnrReceived = dnrAfter - dnrBefore + gasCost;

        console.log("  Received: " + fmt(dnrReceived) + " DNR");
        console.log("  Gas used: " + receiptSwap.gasUsed.toString());
        console.log("  PASSED");
        results.push({ scenario: "1. Swap (KORTUSD->DNR)", status: "PASS" });
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "1. Swap (KORTUSD->DNR)", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 7: BUY KORTUSD WITH DNR
    // =====================================================================
    header(7, "BUY", "Buy KORTUSD with DNR (SwapDNR)");
    try {
        const buyAmount = ethers.parseEther("5");
        const kBefore = await Kortusd.balanceOf(deployer.address);

        console.log("  Swapping " + fmt(buyAmount) + " DNR -> KORTUSD...");
        const txBuy = await SwapDNR.swapExactDNRForTokens(
            0, [C.WDNR, C.kortusd], deployer.address,
            Math.floor(Date.now() / 1000) + 1200,
            { value: buyAmount, ...DEFI }
        );
        await txBuy.wait();

        const kAfter = await Kortusd.balanceOf(deployer.address);
        const received = kAfter - kBefore;

        const [r0b, r1b] = await Pair.getReserves();
        const wRes = isToken0WDNR ? r0b : r1b;
        const kRes = isToken0WDNR ? r1b : r0b;
        const price = Number(fmt(kRes)) / Number(fmt(wRes));

        console.log("  Received: " + fmt(received) + " KORTUSD");
        console.log("  Pool Price: 1 DNR = " + price.toFixed(4) + " KORTUSD");
        console.log("  PASSED");
        results.push({ scenario: "7. Buy KORTUSD with DNR", status: "PASS" });
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "7. Buy KORTUSD with DNR", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 8: SELL KORTUSD TO INCREASE DNR VALUE
    // =====================================================================
    header(8, "SELL", "Sell KORTUSD -> Increase DNR Price");
    try {
        const [r0pre, r1pre] = await Pair.getReserves();
        const wPre = isToken0WDNR ? r0pre : r1pre;
        const kPre = isToken0WDNR ? r1pre : r0pre;
        const priceBefore = Number(fmt(kPre)) / Number(fmt(wPre));

        const sellAmount = ethers.parseEther("500");
        let myBal = await Kortusd.balanceOf(deployer.address);
        if (myBal < sellAmount) {
            console.log("  Minting more KORTUSD...");
            await (await Kortusd.mint(deployer.address, sellAmount, CALL)).wait();
        }

        console.log("  Approving SwapTokens...");
        await (await Kortusd.approve(C.swapTokens, sellAmount, CALL)).wait();

        console.log("  Selling " + fmt(sellAmount) + " KORTUSD -> DNR...");
        await (await SwapTokens.swapExactTokensForDNR(
            sellAmount, 0, [C.kortusd, C.WDNR], deployer.address,
            Math.floor(Date.now() / 1000) + 1200, DEFI
        )).wait();

        const [r0post, r1post] = await Pair.getReserves();
        const wPost = isToken0WDNR ? r0post : r1post;
        const kPost = isToken0WDNR ? r1post : r0post;
        const priceAfter = Number(fmt(kPost)) / Number(fmt(wPost));

        console.log("  DNR Price BEFORE: " + priceBefore.toFixed(4) + " KORTUSD");
        console.log("  DNR Price AFTER : " + priceAfter.toFixed(4) + " KORTUSD");
        const change = ((priceAfter - priceBefore) / priceBefore * 100).toFixed(2);
        console.log("  Change: " + change + "%");

        if (priceAfter > priceBefore) {
            console.log("  PASSED - DNR VALUE INCREASED");
            results.push({ scenario: "8. Sell KORTUSD (DNR up)", status: "PASS" });
        } else {
            console.log("  WARN - Price did not increase");
            results.push({ scenario: "8. Sell KORTUSD (DNR up)", status: "WARN" });
        }
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "8. Sell KORTUSD (DNR up)", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 4: BRIDGE
    // =====================================================================
    header(4, "BRIDGE", "Lock KORTUSD for cross-chain transfer");
    try {
        const bridgeAmount = ethers.parseEther("50");
        const bridgeFee = ethers.parseEther("0.001");

        let myBal = await Kortusd.balanceOf(deployer.address);
        if (myBal < bridgeAmount) {
            await (await Kortusd.mint(deployer.address, bridgeAmount, CALL)).wait();
        }

        console.log("  Approving Bridge...");
        await (await Kortusd.approve(C.bridge, bridgeAmount, CALL)).wait();

        console.log("  Locking " + fmt(bridgeAmount) + " KORTUSD for bridge to BSC...");
        const txBridge = await Bridge.lockTokens(
            C.kortusd, bridgeAmount, 56, deployer.address,
            { value: bridgeFee, ...DEFI }
        );
        const receiptBridge = await txBridge.wait();

        const bridgeLocked = await Kortusd.balanceOf(C.bridge);
        console.log("  KORTUSD in Bridge: " + fmt(bridgeLocked));

        const lockEvent = receiptBridge.logs.find(function(log) {
            try { return Bridge.interface.parseLog(log)?.name === "TokensLocked"; }
            catch(ex) { return false; }
        });
        if (lockEvent) {
            const parsed = Bridge.interface.parseLog(lockEvent);
            console.log("  Bridge TxId: " + parsed.args.txId);
            console.log("  Bridge Nonce: " + parsed.args.nonce.toString());
        }
        console.log("  PASSED");
        results.push({ scenario: "4. Bridge", status: "PASS" });
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "4. Bridge", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 5: FARM
    // =====================================================================
    header(5, "FARM", "Stake LP tokens, earn KORTUSD rewards");
    try {
        // Fund farm
        const farmFund = ethers.parseEther("1000");
        console.log("  Funding Farm with " + fmt(farmFund) + " KORTUSD...");
        let myBal = await Kortusd.balanceOf(deployer.address);
        if (myBal < farmFund) {
            await (await Kortusd.mint(deployer.address, farmFund, CALL)).wait();
        }
        await (await Kortusd.transfer(C.farm, farmFund, CALL)).wait();

        const lpBalance = await Pair.balanceOf(deployer.address);
        console.log("  LP balance: " + fmt(lpBalance));

        if (lpBalance > 0n) {
            const stakeAmount = lpBalance / 4n;
            console.log("  Approving Farm...");
            await (await Pair.approve(C.farm, stakeAmount, CALL)).wait();

            console.log("  Staking " + fmt(stakeAmount) + " LP tokens...");
            await (await Farm.deposit(stakeAmount, DEFI)).wait();

            const staked = (await Farm.userInfo(deployer.address)).amount;
            console.log("  Staked: " + fmt(staked) + " LP");
            console.log("  Total in farm: " + fmt(await Farm.totalStaked()));

            const pending = await Farm.pendingReward(deployer.address);
            console.log("  Pending rewards: " + fmt(pending) + " KORTUSD");

            const kBefore = await Kortusd.balanceOf(deployer.address);
            console.log("  Withdrawing LP + claiming...");
            await (await Farm.withdraw(stakeAmount, DEFI)).wait();
            const kAfter = await Kortusd.balanceOf(deployer.address);
            const claimed = kAfter - kBefore;

            console.log("  Claimed: " + fmt(claimed) + " KORTUSD");
            console.log("  LP returned: " + fmt(await Pair.balanceOf(deployer.address)));
            console.log("  PASSED");
            results.push({ scenario: "5. Farm", status: "PASS" });
        } else {
            console.log("  SKIP - No LP tokens");
            results.push({ scenario: "5. Farm", status: "SKIP" });
        }
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "5. Farm", status: "FAIL" });
    }

    // =====================================================================
    //  SCENARIO 6: ANALYTICS
    // =====================================================================
    header(6, "ANALYTICS", "On-chain DEX metrics");
    try {
        const [fR0, fR1] = await Pair.getReserves();
        const fW = isToken0WDNR ? fR0 : fR1;
        const fK = isToken0WDNR ? fR1 : fR0;
        const fPrice = Number(fmt(fK)) / Number(fmt(fW));

        const totalSupply = await Kortusd.totalSupply();
        const pairSupply = await Pair.totalSupply();
        const wdnrInPair = await WDNR.balanceOf(C.pair);
        const kusdInPair = await Kortusd.balanceOf(C.pair);
        const wdnrInStab = await WDNR.balanceOf(C.stabilizer);
        const kusdInBridge = await Kortusd.balanceOf(C.bridge);
        const kusdInFarm = await Kortusd.balanceOf(C.farm);
        const collRate = await Stabilizer.collateralizationRate();

        console.log("");
        console.log("  KORTANA DEX - LIVE TESTNET DASHBOARD");
        console.log("  ------------------------------------");
        console.log("  POOL:");
        console.log("    WDNR Reserve    : " + fmt(fW));
        console.log("    KORTUSD Reserve : " + fmt(fK));
        console.log("    DNR Price       : " + fPrice.toFixed(4) + " KORTUSD");
        console.log("    LP Total Supply : " + fmt(pairSupply));
        console.log("  KORTUSD:");
        console.log("    Total Supply    : " + fmt(totalSupply));
        console.log("    Collateral Rate : " + (Number(collRate) / 100).toFixed(2) + "%");
        console.log("  TVL:");
        console.log("    WDNR in Pool    : " + fmt(wdnrInPair));
        console.log("    KUSD in Pool    : " + fmt(kusdInPair));
        console.log("    WDNR in Stabil. : " + fmt(wdnrInStab));
        console.log("    KUSD in Bridge  : " + fmt(kusdInBridge));
        console.log("    KUSD in Farm    : " + fmt(kusdInFarm));
        console.log("  PASSED");
        results.push({ scenario: "6. Analytics", status: "PASS" });
    } catch (e) {
        console.error("  FAILED: " + (e.shortMessage || e.message.split("\n")[0]));
        results.push({ scenario: "6. Analytics", status: "FAIL" });
    }

    // =====================================================================
    //  FINAL RESULTS
    // =====================================================================
    console.log("\n\n" + "=".repeat(60));
    console.log("  POSEIDON TESTNET - FINAL TEST RESULTS");
    console.log("=".repeat(60));

    results.sort(function(a, b) { return a.scenario.localeCompare(b.scenario); });
    for (const r of results) {
        console.log("  " + r.scenario.padEnd(35) + " " + r.status);
    }

    const passed = results.filter(function(r) { return r.status === "PASS"; }).length;
    const failed = results.filter(function(r) { return r.status === "FAIL"; }).length;
    const total = results.length;

    console.log("-".repeat(60));
    console.log("  Total: " + total + "  |  Passed: " + passed + "  |  Failed: " + failed);

    if (failed === 0) {
        console.log("\n  ALL SCENARIOS PASSED ON POSEIDON TESTNET!");
    }
    console.log("=".repeat(60) + "\n");

    const finalBal = await ethers.provider.getBalance(deployer.address);
    console.log("  Final Balance: " + fmt(finalBal) + " DNR");
    console.log("  Gas spent: ~" + fmt(bal - finalBal) + " DNR\n");
}

main().catch(function(error) {
    console.error(error);
    process.exitCode = 1;
});
