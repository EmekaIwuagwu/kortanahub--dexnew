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
    const ROUTER_ADDRESS = network.routerAddress;

    try {
        const balance = await provider.getBalance(wallet.address);
        if (balance < ethers.parseUnits("0.5", 18)) {
            throw new Error(`Insufficient Fuel: ${ethers.formatUnits(balance, 18)} DNR (Need >= 0.5)`);
        }

        const router = new ethers.Contract(ROUTER_ADDRESS, [
            'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
            'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
        ], wallet);

        const path = [
            type === 'BUY_USDCK' ? network.dnrAddress : network.usdckAddress,
            type === 'BUY_USDCK' ? network.usdckAddress : network.dnrAddress
        ];

        const deadline = Math.floor(Date.now() / 1000) + 600;

        if (type === 'BUY_USDCK') {
            console.log(`[KortaFlow] ℹ️  Executing Router Swap (DNR -> USDC.k)...`);
            const tx = await router.swapExactETHForTokens(
                0, // No slippage protection for volume bot
                path,
                wallet.address,
                deadline,
                { value: ethers.parseUnits(amountIn.toString(), 18), gasPrice, gasLimit: 250000, type: 0 }
            );
            const receipt = await tx.wait();
            return { status: 'SUCCESS', txHash: tx.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), amountOut: (amountIn * 0.4).toFixed(4) };
        } else {
            console.log(`[KortaFlow] ℹ️  Executing Router Swap (USDC.k -> DNR)...`);
            const token = new ethers.Contract(network.usdckAddress, ERC20_ABI, wallet);
            const amountInWei = ethers.parseUnits(amountIn.toString(), 18);

            // 1. Approve
            const allowance = await token.allowance(wallet.address, ROUTER_ADDRESS);
            if (allowance < amountInWei) {
                const approveTx = await token.approve(ROUTER_ADDRESS, ethers.MaxUint256, { gasPrice, type: 0 });
                await approveTx.wait();
            }

            // 2. Swap
            const tx = await router.swapExactTokensForETH(
                amountInWei,
                0,
                path,
                wallet.address,
                deadline,
                { gasPrice, gasLimit: 250000, type: 0 }
            );
            const receipt = await tx.wait();
            return { status: 'SUCCESS', txHash: tx.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), amountOut: (amountIn * 2.5).toFixed(4) };
        }
    } catch (error) {
        return { status: 'FAILED', failReason: error.message };
    }
};

module.exports = {
    executeSwap
};
