const { ethers } = require('ethers');
const network = require('./config/network');
const strategy = require('./config/strategy');
const walletManager = require('./core/walletManager');
const swapEngine = require('./core/swapEngine');
const priceOracle = require('./core/priceOracle');
const randomizer = require('./utils/randomizer');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const express = require('express');
const chalk = require('chalk');
const dotenv = require('dotenv');

// 1. Keep-Alive Sentinel
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('KortaFlow Bot: ACTIVE 🚀'));
app.get('/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));
app.get('/stats', (req, res) => res.json({
    trade_count: tradeCount,
    dnr_volume: totalDnrVolume,
    usd_volume: totalUsdckVolume,
    success_rate: tradeCount > 0 ? (successCount / tradeCount) * 100 : 0
}));
app.listen(PORT, () => console.log(chalk.blue(`[Sentinel] Heartbeat server active on port ${PORT}`)));

let tradeCount = 0;
let totalDnrVolume = 0;
let totalUsdckVolume = 0;
let successCount = 0;
let errorStreak = 0;

async function printSummary() {
    const successRate = tradeCount > 0 ? (successCount / tradeCount) * 100 : 0;
    console.log('\n' + '─'.repeat(42));
    console.log(' SUMMARY — After ' + tradeCount + ' Trades');
    console.log(` Total Trades:     ${tradeCount}`);
    console.log(` DNR Volume:       ${totalDnrVolume.toFixed(4)} DNR`);
    console.log(` USDC.k Volume:    ${totalUsdckVolume.toFixed(2)} USDC.k`);
    console.log(` Success Rate:     ${successRate.toFixed(2)}%`);
    console.log('─'.repeat(42) + '\n');
}

async function runBot() {
    logger.info(`ℹ️  Bot starting on Kortana Blockchain...`);
    logger.info(`ℹ️  DEX: ${network.routerAddress}`);
    
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    while (true) {
        try {
            // 1. Skip logic (10% chance)
            if (randomizer.getWeightedChance(10)) {
                logger.info(`⚠️  Simulating quiet period. Skipping this cycle.`);
                await new Promise(resolve => setTimeout(resolve, 60000));
                continue;
            }

            // 2. Select Wallet
            const walletData = await walletManager.getNextWallet(provider);
            if (!walletData) {
                logger.info(`⚠️  No wallets available for rotation.`);
                await new Promise(resolve => setTimeout(resolve, 30000));
                continue;
            }
            if (walletData.skip) {
                logger.info(`⚠️  Wallet ${walletManager.maskAddress(walletData.wallet.address)} skipped: ${walletData.reason}`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }

            const { wallet } = walletData;

            // 3. Determine Trade
            const isBuyDNR = randomizer.getWeightedChance(50);
            const tradeType = isBuyDNR ? 'BUY_DNR' : 'BUY_USDCK';
            const amountIn = isBuyDNR 
                ? randomizer.getRandomAmount(strategy.minUsdckTrade, strategy.maxUsdckTrade)
                : randomizer.getRandomAmount(strategy.minDnrTrade, strategy.maxDnrTrade);

            const tokenInSymbol = isBuyDNR ? 'USDC.k' : 'DNR';
            const tokenOutSymbol = isBuyDNR ? 'DNR' : 'USDC.k';

            logger.info(`ℹ️  Preparing Trade #${tradeCount + 1}: ${tradeType} | Wallet: ${walletManager.maskAddress(wallet.address)}`);
            
            // 4. Execute Swap
            const result = await swapEngine.executeSwap(wallet, tradeType, amountIn);

            if (result.status === 'SUCCESS') {
                tradeCount++;
                successCount++;
                errorStreak = 0;
                
                if (isBuyDNR) {
                    totalUsdckVolume += amountIn;
                    totalDnrVolume += parseFloat(result.amountOut);
                } else {
                    totalDnrVolume += amountIn;
                    totalUsdckVolume += parseFloat(result.amountOut);
                }

                logger.info(`✅  Trade #${tradeCount} | ${tradeType} | ${amountIn} ${tokenInSymbol} → ${result.amountOut} ${tokenOutSymbol} | Tx: ${result.txHash}`);
                
                // Detailed entry in logs
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    tradeNumber: tradeCount,
                    tradeType,
                    wallet: wallet.address,
                    amountIn: amountIn.toString(),
                    tokenIn: tokenInSymbol,
                    amountOut: result.amountOut,
                    tokenOut: tokenOutSymbol,
                    txHash: result.txHash,
                    blockNumber: result.blockNumber,
                    gasUsed: result.gasUsed,
                    explorerLink: `${network.explorerBaseUrl}/tx/${result.txHash}`,
                    status: 'SUCCESS'
                };
                
                if (tradeCount % 10 === 0) await printSummary();

            } else {
                logger.info(`❌  Trade FAILED: ${result.failReason}`);
                errorStreak++;
                if (errorStreak >= 3) {
                    logger.info(`⚠️  3 consecutive failures. Pausing for 5 minutes.`);
                    await new Promise(resolve => setTimeout(resolve, 300000));
                    errorStreak = 0;
                }
            }

            // 5. Random Delay
            const delay = randomizer.getRandomDelay(strategy.minDelaySeconds, strategy.maxDelaySeconds);
            logger.info(`⚠️  Waiting ${Math.floor(delay/1000)} seconds before next trade...`);
            await new Promise(resolve => setTimeout(resolve, delay));

        } catch (error) {
            logger.info(`❌  CRITICAL ERROR: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\n[KortaFlow] ℹ️  Shutting down...');
    await printSummary();
    process.exit(0);
});

runBot();
