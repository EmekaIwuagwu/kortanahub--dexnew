const { ethers } = require('ethers');
const network = require('../config/network');
const strategy = require('../config/strategy');
const walletManager = require('../core/walletManager');
const swapEngine = require('../core/swapEngine');
const chalk = require('chalk');

async function main() {
    console.log(chalk.bold.blue('\n--- 🏛️ KORTAFLOW END-TO-END MASTER AUDIT ---'));
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    // 1. Pre-Flight Balance Audit
    console.log(chalk.yellow('\n[1/3] Auditing Wallet Pool Balances...'));
    const wData = await walletManager.getNextWallet(provider);
    if (!wData || wData.skip) {
        console.error(chalk.red('❌ BALANCE AUDIT FAILED: Ensure WALLET_1 is funded with DNR and USDC.k'));
        process.exit(1);
    }
    console.log(chalk.green(`✅ Audit Passed. Using Wallet: ${walletManager.maskAddress(wData.wallet.address)}`));

    // 2. Bidirectional Trade Simulation
    console.log(chalk.yellow('\n[2/3] Executing Bidirectional Cycle...'));

    // Trade A: Buy USDC.k (Quantity 1.0 DNR)
    console.log(chalk.blue('   🔄 Cycle A: Selling 1.0 DNR -> Buying USDC.k...'));
    const resA = await swapEngine.executeSwap(wData.wallet, 'BUY_USDCK', 1.0);
    if (resA.status === 'SUCCESS') {
        console.log(chalk.green(`   ✅ Cycle A Success! Hash: ${resA.txHash}`));
    } else {
        console.log(chalk.red(`   ❌ Cycle A Failed: ${resA.failReason}`));
        process.exit(1);
    }

    // Trade B: Buy DNR (Quantity 5.0 USDC.k)
    console.log(chalk.blue('\n   🔄 Cycle B: Selling 5.0 USDC.k -> Buying DNR...'));
    const resB = await swapEngine.executeSwap(wData.wallet, 'BUY_DNR', 5.0);
    if (resB.status === 'SUCCESS') {
        console.log(chalk.green(`   ✅ Cycle B Success! Hash: ${resB.txHash}`));
    } else {
        console.log(chalk.red(`   ❌ Cycle B Failed: ${resB.failReason}`));
        process.exit(1);
    }

    // 3. Final Conclusion
    console.log(chalk.bold.green('\n--- 🏁 E2E AUDIT COMPLETE: ALL SYSTEMS NOMINAL ---'));
    console.log(chalk.white(`Block Height: ${resB.blockNumber}`));
    console.log(chalk.white('Ready for Production Launch. 🚀\n'));
}

main().catch(error => {
    console.error(chalk.red(`\n❌ E2E CRITICAL ERROR: ${error.message}`));
    process.exit(1);
});
