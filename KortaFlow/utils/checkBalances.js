const { ethers } = require('ethers');
const network = require('../config/network');
const wallets = require('../config/wallets');
const chalk = require('chalk');

async function main() {
    console.log(chalk.blue(`[KortaFlow] ℹ️  Checking wallet pool balances on ${network.rpcUrl}...`));
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    
    const erc20Abi = ['function balanceOf(address) view returns (uint256)', 'function symbol() view returns (string)'];
    const usdck = new ethers.Contract(network.usdckAddress, erc20Abi, provider);
    const dnrToken = new ethers.Contract(network.dnrAddress, erc20Abi, provider);

    for (let i = 0; i < wallets.walletKeys.length; i++) {
        const wallet = new ethers.Wallet(wallets.walletKeys[i], provider);
        const nativeBal = await provider.getBalance(wallet.address);
        const usdckBal = await usdck.balanceOf(wallet.address);
        const dnrTokenBal = await dnrToken.balanceOf(wallet.address);

        console.log(`\nWallet #${i + 1}: ${wallet.address}`);
        console.log(`- Native DNR: ${chalk.yellow(ethers.formatEther(nativeBal))}`);
        console.log(`- USDC.k:     ${chalk.green(ethers.formatUnits(usdckBal, 18))}`);
        console.log(`- sDNR(uDNR): ${chalk.blue(ethers.formatUnits(dnrTokenBal, 18))}`);
    }
}

main().catch(console.error);
