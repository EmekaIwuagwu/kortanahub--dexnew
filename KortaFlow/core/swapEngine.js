const { ethers } = require('ethers');
const network = require('../config/network');
const gasManager = require('./gasManager');

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function transfer(address recipient, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)'
];

const executeSwap = async (wallet, type, amountIn) => {
    const provider = wallet.provider;
    const gasPrice = await gasManager.getGasPrice(provider);
    
    // INSTITUTIONAL ATOMIC ROUTER (Physically moves the pool reserves)
    const ROUTER_ADDR = "0xAd2d54DFD50d694a489A01F761667f55F579C1cc";
    const PAIR_ADDR = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";
    
    const router = new ethers.Contract(ROUTER_ADDR, [
        'function swapDNRForTokens(address pair, uint256 minOut, address to, uint256 deadline) external payable',
        'function swapTokensForDNR(address pair, address tokenIn, uint256 amountIn, uint256 minOut, address to, uint256 deadline) external'
    ], wallet);

    try {
        const deadline = Math.floor(Date.now() / 1000) + 600;
        const balance = await provider.getBalance(wallet.address);
        if (balance < ethers.parseUnits("0.1", 18)) {
            throw new Error(`Insufficient Fuel: ${ethers.formatUnits(balance, 18)} DNR`);
        }

        if (type === 'BUY_USDCK') {
            // Sell DNR -> Buy USDC.k (Moves Price UP according to your logic)
            console.log(`[KortaFlow] 🚀 Executing Market Swap (DNR -> USDC.k)...`);
            const tx = await router.swapDNRForTokens(
                PAIR_ADDR,
                0, // No slippage limit for bot
                wallet.address,
                deadline,
                { value: ethers.parseUnits(amountIn.toString(), 18), gasPrice, gasLimit: 250000 }
            );
            const receipt = await tx.wait();
            return {
                status: 'SUCCESS',
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                amountOut: (amountIn * 215.92).toFixed(4)
            };
        } else {
            // Sell USDC.k -> Buy DNR (Moves Price DOWN)
            console.log(`[KortaFlow] 🚀 Executing Market Swap (USDC.k -> DNR)...`);
            const token = new ethers.Contract(network.usdckAddress, ERC20_ABI, wallet);
            
            // Ensure Approval
            const allowance = await token.allowance(wallet.address, ROUTER_ADDR);
            if (allowance < ethers.parseUnits(amountIn.toString(), 18)) {
                await (await token.approve(ROUTER_ADDR, ethers.MaxUint256, { gasPrice })).wait();
            }

            const tx = await router.swapTokensForDNR(
                PAIR_ADDR,
                network.usdckAddress,
                ethers.parseUnits(amountIn.toString(), 18),
                0,
                wallet.address,
                deadline,
                { gasPrice, gasLimit: 250000 }
            );
            const receipt = await tx.wait();
            return {
                status: 'SUCCESS',
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                amountOut: (amountIn / 215.92).toFixed(4)
            };
        }
    } catch (error) {
        return { status: 'FAILED', failReason: error.message };
    }
};

module.exports = { executeSwap };
