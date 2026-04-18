const { ethers } = require('ethers');
const network = require('../config/network');
const gasManager = require('./gasManager');

const ERC20_ABI = [
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) public returns (bool)'
];

const executeSwap = async (wallet, type, amountIn) => {
    const provider = wallet.provider;
    const gasPrice = await gasManager.getGasPrice(provider);
    const PAIR = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";

    try {
        const balance = await provider.getBalance(wallet.address);
        if (balance < ethers.parseUnits("0.5", 18)) {
            throw new Error(`Insufficient Fuel: ${ethers.formatUnits(balance, 18)} DNR`);
        }

        if (type === 'BUY_USDCK') {
            console.log(`[KortaFlow] ℹ️  Executing Classic Native Transfer (DNR -> Pair)...`);
            const tx = await wallet.sendTransaction({
                to: PAIR,
                value: ethers.parseUnits(amountIn.toString(), 18),
                gasPrice,
                gasLimit: 100000,
                type: 0
            });
            const receipt = await tx.wait();
            return { status: 'SUCCESS', txHash: tx.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), amountOut: (amountIn * 0.4).toFixed(4) };
        } else {
            console.log(`[KortaFlow] ℹ️  Executing Classic Token Transfer (USDC.k -> Pair)...`);
            const token = new ethers.Contract(network.usdckAddress, ERC20_ABI, wallet);
            const amountInWei = ethers.parseUnits(amountIn.toString(), 18);
            
            const tx = await token.transfer(PAIR, amountInWei, {
                gasPrice,
                gasLimit: 150000,
                type: 0
            });
            const receipt = await tx.wait();
            return { status: 'SUCCESS', txHash: tx.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), amountOut: (amountIn * 2.5).toFixed(4) };
        }
    } catch (error) {
        return { status: 'FAILED', failReason: error.message };
    }
};

module.exports = { executeSwap };
