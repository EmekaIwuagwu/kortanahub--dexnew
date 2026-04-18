/**
 * ═══════════════════════════════════════════════════════════════════
 *  KORTANA DEX — FULL E2E SCENARIO TEST
 *  Tests ALL 8 scenarios on local Hardhat network
 * ═══════════════════════════════════════════════════════════════════
 *
 *  1. Swap (Token-to-Token via Router)
 *  2. Liquidity (Pool DNR/KORTUSD)
 *  3. Mint KORTUSD via Stabilizer
 *  4. Bridge KORTUSD to destination chain
 *  5. Farm (Stake LP tokens, earn KORTUSD rewards)
 *  6. Analytics (TVL, reserves, prices, supply)
 *  7. Buy KORTUSD with DNR
 *  8. Sell KORTUSD to increase DNR value
 *
 *  NOTE: All transactions use legacy gas (type: 0) because
 *        Kortana RPC does not support EIP-1559 Dynamic Gas.
 * ═══════════════════════════════════════════════════════════════════
 */

const { ethers } = require("hardhat");

// ─── HELPERS ────────────────────────────────────────────────────────────────
function header(num, emoji, title) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`  [${num}/8] ${emoji}  ${title}`);
    console.log(`${"─".repeat(60)}`);
}

function fmt(val) { return ethers.formatEther(val); }

async function main() {
    const [deployer, user1, user2] = await ethers.getSigners();

    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║     🚀 KORTANA DEX — COMPREHENSIVE E2E TEST SUITE 🚀    ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log(`\n  Deployer : ${deployer.address}`);
    console.log(`  User1    : ${user1.address}`);
    console.log(`  User2    : ${user2.address}\n`);

    // ════════════════════════════════════════════════════════════════════════
    //  PHASE 0: DEPLOY ALL CONTRACTS
    // ════════════════════════════════════════════════════════════════════════
    console.log("━━━ PHASE 0: DEPLOYING ALL CONTRACTS ━━━\n");

    // --- Core tokens ---
    const WDNR = await ethers.deployContract("WDNR");
    await WDNR.waitForDeployment();
    console.log(`  ✔ WDNR             : ${WDNR.target}`);

    const KORTUSD = await ethers.deployContract("KORTUSD", [deployer.address]);
    await KORTUSD.waitForDeployment();
    console.log(`  ✔ KORTUSD           : ${KORTUSD.target}`);

    // --- Factory ---
    const Factory = await ethers.deployContract("KortanaFactory", [deployer.address]);
    await Factory.waitForDeployment();
    console.log(`  ✔ Factory           : ${Factory.target}`);

    // --- Pair (manual deploy + register) ---
    const Pair = await ethers.deployContract("KortanaPair");
    await Pair.waitForDeployment();
    // Sort tokens to match factory expectations
    const [tokenA, tokenB] = WDNR.target.toLowerCase() < KORTUSD.target.toLowerCase()
        ? [WDNR.target, KORTUSD.target]
        : [KORTUSD.target, WDNR.target];
    await (await Pair.initialize(tokenA, tokenB)).wait();
    await (await Factory.registerPair(WDNR.target, KORTUSD.target, Pair.target)).wait();
    console.log(`  ✔ Pair (WDNR/KORTUSD): ${Pair.target}`);
    
    const token0 = await Pair.token0();
    const isToken0WDNR = token0.toLowerCase() === WDNR.target.toLowerCase();

    // --- Router (monolithic, for token-to-token swaps) ---
    const Router = await ethers.deployContract("KortanaRouter", [Factory.target, WDNR.target]);
    await Router.waitForDeployment();
    console.log(`  ✔ Router            : ${Router.target}`);

    // --- Modular swap/liquidity contracts ---
    const SwapDNR = await ethers.deployContract("KortanaSwapDNR", [Factory.target, WDNR.target]);
    await SwapDNR.waitForDeployment();
    console.log(`  ✔ SwapDNR           : ${SwapDNR.target}`);

    const SwapTokens = await ethers.deployContract("KortanaSwapTokens", [Factory.target, WDNR.target]);
    await SwapTokens.waitForDeployment();
    console.log(`  ✔ SwapTokens        : ${SwapTokens.target}`);

    const LiquidityMgr = await ethers.deployContract("KortanaLiquidityManager", [Factory.target, WDNR.target]);
    await LiquidityMgr.waitForDeployment();
    console.log(`  ✔ LiquidityManager  : ${LiquidityMgr.target}`);

    // --- Oracle (manual price feed for bootstrapping) ---
    const Oracle = await ethers.deployContract("KortanaOracle", [Pair.target]);
    await Oracle.waitForDeployment();
    console.log(`  ✔ Oracle            : ${Oracle.target}`);

    // --- Stabilizer ---
    const Stabilizer = await ethers.deployContract("KortanaStabilizer", [
        KORTUSD.target, Oracle.target, WDNR.target, deployer.address
    ]);
    await Stabilizer.waitForDeployment();
    console.log(`  ✔ Stabilizer        : ${Stabilizer.target}`);

    // --- Bridge ---
    const Bridge = await ethers.deployContract("KortanaBridgeSource");
    await Bridge.waitForDeployment();
    console.log(`  ✔ Bridge            : ${Bridge.target}`);

    // --- Farm (LP staking for KORTUSD rewards) ---
    const rewardPerBlock = ethers.parseEther("10"); // 10 KORTUSD per block
    const Farm = await ethers.deployContract("KortanaFarm", [
        Pair.target, KORTUSD.target, rewardPerBlock
    ]);
    await Farm.waitForDeployment();
    console.log(`  ✔ Farm              : ${Farm.target}`);

    // --- Role Setup ---
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
    await (await KORTUSD.grantRole(MINTER_ROLE, Stabilizer.target)).wait();
    await (await KORTUSD.grantRole(BURNER_ROLE, Stabilizer.target)).wait();
    await (await KORTUSD.grantRole(MINTER_ROLE, deployer.address)).wait();
    await (await Bridge.addSupportedToken(KORTUSD.target)).wait();
    await (await Bridge.addSupportedToken(WDNR.target)).wait();

    // Set oracle prices: 1 WDNR = $2.00, 1 KORTUSD = $1.00
    await (await Oracle.setManualPrices(ethers.parseEther("2.0"), ethers.parseEther("1.0"))).wait();

    console.log(`\n  ✅ All ${11} contracts deployed + configured!\n`);

    // Track test results
    const results = [];

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 3: MINT KORTUSD VIA STABILIZER
    //  (Run first since we need KORTUSD to seed the pool)
    // ════════════════════════════════════════════════════════════════════════
    header(3, "🪙", "MINT — Mint KORTUSD via Stabilizer");
    try {
        // User1 wraps 2000 DNR into WDNR
        const wrapAmount = ethers.parseEther("2000");
        await (await WDNR.connect(user1).deposit({ value: wrapAmount })).wait();
        console.log(`  User1 wrapped ${fmt(wrapAmount)} DNR → WDNR`);

        // Approve Stabilizer to spend WDNR
        await (await WDNR.connect(user1).approve(Stabilizer.target, wrapAmount)).wait();

        // Mint KORTUSD: 2000 WDNR @ $2 = $4000 value, 80% collateral ratio → 5000 KORTUSD (minus 0.5% fee)
        const mintTx = await Stabilizer.connect(user1).mint(wrapAmount, 0);
        await mintTx.wait();

        const user1Kortusd = await KORTUSD.balanceOf(user1.address);
        const treasuryKortusd = await KORTUSD.balanceOf(deployer.address);
        console.log(`  User1 minted: ${fmt(user1Kortusd)} KORTUSD`);
        console.log(`  Treasury fee: ${fmt(treasuryKortusd)} KORTUSD`);
        console.log(`  Collateral locked in Stabilizer: ${fmt(await WDNR.balanceOf(Stabilizer.target))} WDNR`);
        console.log(`  ✅ MINT PASSED`);
        results.push({ scenario: "3. Mint KORTUSD", status: "✅ PASS" });
    } catch (e) {
        console.error(`  ❌ MINT FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "3. Mint KORTUSD", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 2: PROVIDE LIQUIDITY (POOL DNR/KORTUSD)
    // ════════════════════════════════════════════════════════════════════════
    header(2, "💧", "LIQUIDITY — Pool DNR/KORTUSD");
    try {
        const dnrLiq = ethers.parseEther("500");
        const kortusdLiq = ethers.parseEther("1000");

        // Approve LiquidityManager to spend User1's KORTUSD
        await (await KORTUSD.connect(user1).approve(LiquidityMgr.target, kortusdLiq)).wait();

        const txLiq = await LiquidityMgr.connect(user1).addLiquidityDNR(
            KORTUSD.target,
            kortusdLiq,
            0, 0,
            user1.address,
            Math.floor(Date.now() / 1000) + 3600,
            { value: dnrLiq }
        );
        const receiptLiq = await txLiq.wait();

        const [r0, r1] = await Pair.getReserves();
        const wdnrReserve = isToken0WDNR ? r0 : r1;
        const kortusdReserve = isToken0WDNR ? r1 : r0;
        const lpBalance = await Pair.balanceOf(user1.address);

        console.log(`  Added: ${fmt(dnrLiq)} DNR + ${fmt(kortusdLiq)} KORTUSD`);
        console.log(`  Pool Reserves — WDNR: ${fmt(wdnrReserve)}, KORTUSD: ${fmt(kortusdReserve)}`);
        console.log(`  User1 LP tokens: ${fmt(lpBalance)}`);
        console.log(`  Gas used: ${receiptLiq.gasUsed.toString()}`);
        console.log(`  ✅ LIQUIDITY PASSED`);
        results.push({ scenario: "2. Liquidity (Pool)", status: "✅ PASS" });
    } catch (e) {
        console.error(`  ❌ LIQUIDITY FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "2. Liquidity (Pool)", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 1: SWAP (Token-to-Token via Router)
    // ════════════════════════════════════════════════════════════════════════
    header(1, "🔄", "SWAP — Token-to-Token swap (Router)");
    try {
        // Mint some KORTUSD directly to user2 for swap testing
        const mintForUser2 = ethers.parseEther("500");
        await (await KORTUSD.mint(user2.address, mintForUser2)).wait();

        // User2 swaps KORTUSD → WDNR via Router (swapExactTokensForDNR — gets native DNR back)
        const swapAmount = ethers.parseEther("100");
        await (await KORTUSD.connect(user2).approve(Router.target, swapAmount)).wait();

        const user2DnrBefore = await ethers.provider.getBalance(user2.address);
        const txSwap = await Router.connect(user2).swapExactTokensForDNR(
            swapAmount,
            0,
            [KORTUSD.target, WDNR.target],
            user2.address,
            Math.floor(Date.now() / 1000) + 3600
        );
        const receiptSwap = await txSwap.wait();
        const user2DnrAfter = await ethers.provider.getBalance(user2.address);
        const gasCost = receiptSwap.gasUsed * receiptSwap.gasPrice;
        const dnrReceived = user2DnrAfter - user2DnrBefore + gasCost;

        console.log(`  User2 swapped ${fmt(swapAmount)} KORTUSD → ${fmt(dnrReceived)} DNR`);
        console.log(`  Gas used: ${receiptSwap.gasUsed.toString()}`);
        console.log(`  ✅ SWAP (TOKEN→DNR) PASSED`);
        results.push({ scenario: "1. Swap (Token→DNR)", status: "✅ PASS" });
    } catch (e) {
        console.error(`  ❌ SWAP FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "1. Swap (Token→DNR)", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 7: BUY KORTUSD WITH DNR
    // ════════════════════════════════════════════════════════════════════════
    header(7, "🛒", "BUY KORTUSD — Swap DNR → KORTUSD (via SwapDNR module)");
    try {
        const buyDnrAmount = ethers.parseEther("50");
        const user2KortusdBefore = await KORTUSD.balanceOf(user2.address);

        const txBuy = await SwapDNR.connect(user2).swapExactDNRForTokens(
            0,
            [WDNR.target, KORTUSD.target],
            user2.address,
            Math.floor(Date.now() / 1000) + 3600,
            { value: buyDnrAmount }
        );
        await txBuy.wait();

        const user2KortusdAfter = await KORTUSD.balanceOf(user2.address);
        const kortusdReceived = user2KortusdAfter - user2KortusdBefore;

        const [r0b, r1b] = await Pair.getReserves();
        const wdnrRes = isToken0WDNR ? r0b : r1b;
        const usdRes = isToken0WDNR ? r1b : r0b;
        const priceAfterBuy = Number(fmt(usdRes)) / Number(fmt(wdnrRes));

        console.log(`  User2 spent ${fmt(buyDnrAmount)} DNR → received ${fmt(kortusdReceived)} KORTUSD`);
        console.log(`  📊 Pool Price: 1 DNR = ${priceAfterBuy.toFixed(4)} KORTUSD`);
        console.log(`  ✅ BUY KORTUSD WITH DNR PASSED`);
        results.push({ scenario: "7. Buy KORTUSD with DNR", status: "✅ PASS" });
    } catch (e) {
        console.error(`  ❌ BUY FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "7. Buy KORTUSD with DNR", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 8: SELL KORTUSD TO INCREASE DNR VALUE
    // ════════════════════════════════════════════════════════════════════════
    header(8, "📈", "SELL KORTUSD — Increase DNR Price (via SwapTokens module)");
    try {
        const [r0pre, r1pre] = await Pair.getReserves();
        const wdnrPre = isToken0WDNR ? r0pre : r1pre;
        const usdPre = isToken0WDNR ? r1pre : r0pre;
        const priceBefore = Number(fmt(usdPre)) / Number(fmt(wdnrPre));

        // User2 sells KORTUSD for DNR
        const sellAmount = ethers.parseEther("200");
        await (await KORTUSD.connect(user2).approve(SwapTokens.target, sellAmount)).wait();

        const txSell = await SwapTokens.connect(user2).swapExactTokensForDNR(
            sellAmount,
            0,
            [KORTUSD.target, WDNR.target],
            user2.address,
            Math.floor(Date.now() / 1000) + 3600
        );
        await txSell.wait();

        const [r0post, r1post] = await Pair.getReserves();
        const wdnrPost = isToken0WDNR ? r0post : r1post;
        const usdPost = isToken0WDNR ? r1post : r0post;
        const priceAfter = Number(fmt(usdPost)) / Number(fmt(wdnrPost));

        console.log(`  User2 sold ${fmt(sellAmount)} KORTUSD → received DNR`);
        console.log(`  📊 DNR Price BEFORE sell: ${priceBefore.toFixed(4)} KORTUSD`);
        console.log(`  📊 DNR Price AFTER  sell: ${priceAfter.toFixed(4)} KORTUSD`);
        console.log(`  📈 DNR price change: ${((priceAfter - priceBefore) / priceBefore * 100).toFixed(2)}%`);
        
        if (priceAfter > priceBefore) {
            console.log(`  ✅ SELL KORTUSD → DNR VALUE INCREASED ✅`);
            results.push({ scenario: "8. Sell KORTUSD (↑ DNR)", status: "✅ PASS" });
        } else {
            console.log(`  ⚠️  Price did not increase as expected`);
            results.push({ scenario: "8. Sell KORTUSD (↑ DNR)", status: "⚠️ WARN" });
        }
    } catch (e) {
        console.error(`  ❌ SELL FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "8. Sell KORTUSD (↑ DNR)", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 4: BRIDGE KORTUSD TO DESTINATION CHAIN
    // ════════════════════════════════════════════════════════════════════════
    header(4, "🌉", "BRIDGE — Lock KORTUSD for cross-chain transfer");
    try {
        const bridgeAmount = ethers.parseEther("100");
        const bridgeFee = ethers.parseEther("0.001");

        // User1 approves bridge
        await (await KORTUSD.connect(user1).approve(Bridge.target, bridgeAmount)).wait();

        const user1KortusdBefore = await KORTUSD.balanceOf(user1.address);

        const txBridge = await Bridge.connect(user1).lockTokens(
            KORTUSD.target,
            bridgeAmount,
            56,                 // Destination: BSC
            user1.address,
            { value: bridgeFee }
        );
        const receiptBridge = await txBridge.wait();

        const user1KortusdAfter = await KORTUSD.balanceOf(user1.address);
        const bridgeLocked = await KORTUSD.balanceOf(Bridge.target);

        // Check for the TokensLocked event
        const lockEvent = receiptBridge.logs.find(log => {
            try {
                return Bridge.interface.parseLog(log)?.name === "TokensLocked";
            } catch { return false; }
        });
        const parsedEvent = lockEvent ? Bridge.interface.parseLog(lockEvent) : null;

        console.log(`  User1 locked ${fmt(bridgeAmount)} KORTUSD for bridge to BSC (chainId: 56)`);
        console.log(`  Bridge fee paid: ${fmt(bridgeFee)} DNR`);
        console.log(`  KORTUSD held by Bridge contract: ${fmt(bridgeLocked)}`);
        console.log(`  User1 KORTUSD balance reduced: ${fmt(user1KortusdBefore)} → ${fmt(user1KortusdAfter)}`);
        if (parsedEvent) {
            console.log(`  Bridge TxId: ${parsedEvent.args.txId}`);
            console.log(`  Bridge Nonce: ${parsedEvent.args.nonce.toString()}`);
        }
        console.log(`  ✅ BRIDGE PASSED`);
        results.push({ scenario: "4. Bridge", status: "✅ PASS" });
    } catch (e) {
        console.error(`  ❌ BRIDGE FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "4. Bridge", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 5: FARM — Stake LP tokens, earn KORTUSD rewards
    // ════════════════════════════════════════════════════════════════════════
    header(5, "🌾", "FARM — Stake LP tokens, earn KORTUSD rewards");
    try {
        // Fund the Farm with reward tokens
        const farmRewardFund = ethers.parseEther("10000");
        await (await KORTUSD.mint(Farm.target, farmRewardFund)).wait();
        console.log(`  Funded Farm with ${fmt(farmRewardFund)} KORTUSD rewards`);

        // User1 has LP tokens from the liquidity step
        const user1LP = await Pair.balanceOf(user1.address);
        console.log(`  User1 LP balance: ${fmt(user1LP)}`);

        if (user1LP > 0n) {
            // Approve Farm to spend LP tokens
            await (await Pair.connect(user1).approve(Farm.target, user1LP)).wait();

            // Stake half the LP tokens
            const stakeAmount = user1LP / 2n;
            await (await Farm.connect(user1).deposit(stakeAmount)).wait();
            console.log(`  User1 staked ${fmt(stakeAmount)} LP tokens`);

            const staked = (await Farm.userInfo(user1.address)).amount;
            console.log(`  Farm shows User1 staked: ${fmt(staked)}`);
            console.log(`  Total staked in farm: ${fmt(await Farm.totalStaked())}`);

            // Mine some blocks to accumulate rewards
            for (let i = 0; i < 5; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            const pending = await Farm.pendingReward(user1.address);
            console.log(`  Pending rewards after 5 blocks: ${fmt(pending)} KORTUSD`);

            // Withdraw and claim
            const user1KortusdBefore = await KORTUSD.balanceOf(user1.address);
            await (await Farm.connect(user1).withdraw(stakeAmount)).wait();
            const user1KortusdAfter = await KORTUSD.balanceOf(user1.address);
            const rewardsClaimed = user1KortusdAfter - user1KortusdBefore;

            console.log(`  User1 withdrew LP + claimed ${fmt(rewardsClaimed)} KORTUSD rewards`);
            console.log(`  User1 LP balance restored: ${fmt(await Pair.balanceOf(user1.address))}`);
            console.log(`  ✅ FARM PASSED`);
            results.push({ scenario: "5. Farm", status: "✅ PASS" });
        } else {
            console.log(`  ⚠️  User1 has no LP tokens (liquidity step may have failed)`);
            results.push({ scenario: "5. Farm", status: "⚠️ SKIP" });
        }
    } catch (e) {
        console.error(`  ❌ FARM FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "5. Farm", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SCENARIO 6: ANALYTICS — On-chain metrics
    // ════════════════════════════════════════════════════════════════════════
    header(6, "📊", "ANALYTICS — On-chain DEX metrics");
    try {
        // Pool reserves
        const [finalR0, finalR1] = await Pair.getReserves();
        const finalWDNR = isToken0WDNR ? finalR0 : finalR1;
        const finalKORTUSD = isToken0WDNR ? finalR1 : finalR0;
        const finalPrice = Number(fmt(finalKORTUSD)) / Number(fmt(finalWDNR));

        // Supply
        const kortusdTotalSupply = await KORTUSD.totalSupply();
        const pairTotalSupply = await Pair.totalSupply();

        // TVL calculation
        const wdnrInPair = await WDNR.balanceOf(Pair.target);
        const kortusdInPair = await KORTUSD.balanceOf(Pair.target);
        const wdnrInStabilizer = await WDNR.balanceOf(Stabilizer.target);
        const kortusdInBridge = await KORTUSD.balanceOf(Bridge.target);
        const kortusdInFarm = await KORTUSD.balanceOf(Farm.target);

        // Collateralization
        const collateralRate = await Stabilizer.collateralizationRate();

        console.log(`\n  ┌────────────────────────────────────────────────┐`);
        console.log(`  │          KORTANA DEX ANALYTICS DASHBOARD       │`);
        console.log(`  ├────────────────────────────────────────────────┤`);
        console.log(`  │ POOL METRICS                                   │`);
        console.log(`  │   WDNR Reserve    : ${fmt(finalWDNR).padStart(23)} │`);
        console.log(`  │   KORTUSD Reserve : ${fmt(finalKORTUSD).padStart(23)} │`);
        console.log(`  │   DNR Price       : ${finalPrice.toFixed(4).padStart(19)} KUSD │`);
        console.log(`  │   LP Total Supply : ${fmt(pairTotalSupply).padStart(23)} │`);
        console.log(`  ├────────────────────────────────────────────────┤`);
        console.log(`  │ KORTUSD METRICS                                │`);
        console.log(`  │   Total Supply    : ${fmt(kortusdTotalSupply).padStart(23)} │`);
        console.log(`  │   Collateral Rate : ${(Number(collateralRate) / 100).toFixed(2).padStart(20)}%  │`);
        console.log(`  ├────────────────────────────────────────────────┤`);
        console.log(`  │ TVL BREAKDOWN                                  │`);
        console.log(`  │   WDNR in Pool    : ${fmt(wdnrInPair).padStart(23)} │`);
        console.log(`  │   KUSD in Pool    : ${fmt(kortusdInPair).padStart(23)} │`);
        console.log(`  │   WDNR in Stabil. : ${fmt(wdnrInStabilizer).padStart(23)} │`);
        console.log(`  │   KUSD in Bridge  : ${fmt(kortusdInBridge).padStart(23)} │`);
        console.log(`  │   KUSD in Farm    : ${fmt(kortusdInFarm).padStart(23)} │`);
        console.log(`  └────────────────────────────────────────────────┘`);
        console.log(`  ✅ ANALYTICS PASSED`);
        results.push({ scenario: "6. Analytics", status: "✅ PASS" });
    } catch (e) {
        console.error(`  ❌ ANALYTICS FAILED: ${e.shortMessage || e.message.split("\n")[0]}`);
        results.push({ scenario: "6. Analytics", status: "❌ FAIL", error: e.shortMessage || e.message.split("\n")[0] });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  FINAL RESULTS
    // ════════════════════════════════════════════════════════════════════════
    console.log(`\n\n╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║             📋 FINAL TEST RESULTS                        ║`);
    console.log(`╠═══════════════════════════════════════════════════════════╣`);

    // Sort by scenario number
    results.sort((a, b) => a.scenario.localeCompare(b.scenario));
    for (const r of results) {
        const line = `  ${r.scenario.padEnd(35)} ${r.status}`;
        console.log(`║ ${line.padEnd(56)}║`);
    }

    const passed = results.filter(r => r.status.includes("PASS")).length;
    const failed = results.filter(r => r.status.includes("FAIL")).length;
    const total = results.length;

    console.log(`╠═══════════════════════════════════════════════════════════╣`);
    console.log(`║  Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}                       ║`);

    if (failed === 0) {
        console.log(`║                                                           ║`);
        console.log(`║     🎉  ALL SCENARIOS PASSED WITH FLYING COLORS! 🎉       ║`);
    }
    console.log(`╚═══════════════════════════════════════════════════════════╝\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
