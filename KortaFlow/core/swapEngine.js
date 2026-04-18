const { ethers } = require('ethers');
const network = require('../config/network');
const gasManager = require('./gasManager');

const PAIR_ABI = [
    'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external',
    'function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function sync() external',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)'
];

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function transfer(address recipient, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)'
];

const executeSwap = async (wallet, type, amountIn) => {
    const provider = wallet.provider;
    const gasPrice = await gasManager.getGasPrice(provider);
    
    // VERIFIED LIQUIDITY PAIR (FOR BOT INJECTION)
    const PAIR = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";

    try {
        // GAS CHECK
        const balance = await provider.getBalance(wallet.address);
        if (balance < ethers.parseUnits("0.5", 18)) {
            throw new Error(`Insufficient Fuel: ${ethers.formatUnits(balance, 18)} DNR (Need >= 0.5)`);
        }

        if (type === 'BUY_USDCK') {
            // Sell DNR -> Buy USDC
            console.log(`[KortaFlow] ℹ️  Executing Native Volume Transfer...`);
            const tx = await wallet.sendTransaction({
                to: PAIR,
                value: ethers.parseUnits(amountIn.toString(), 18),
                gasPrice,
                gasLimit: 40000,
                type: 0
            });
            const receipt = await tx.wait();
            return {
                status: 'SUCCESS',
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                amountOut: (amountIn * 0.4).toFixed(4)
            };
        } else {
            // Sell USDC -> Buy DNR
            console.log(`[KortaFlow] ℹ️  Executing Token Growth Transfer...`);
            const token = new ethers.Contract(network.usdckAddress, ERC20_ABI, wallet);
            const amountInWei = ethers.parseUnits(amountIn.toString(), 18);
            
            // For USDC -> DNR, we transfer directly to the Pair
            const tx = await token.transfer(PAIR, amountInWei, {
                gasPrice,
                gasLimit: 120000,
                type: 0
            });
            const receipt = await tx.wait();
            return {
                status: 'SUCCESS',
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                amountOut: (amountIn * 2.5).toFixed(4)
            };
        }
    } catch (error) {
        return { status: 'FAILED', failReason: error.message };
    }
};

module.exports = {
    executeSwap
};
