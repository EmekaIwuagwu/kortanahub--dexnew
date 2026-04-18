import { ethers } from "ethers";

const routerAbi = [
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
];

export async function swapExactTokensForTokens(
    signer: ethers.Signer,
    routerAddress: string,
    amountIn: bigint,
    amountOutMin: bigint,
    path: string[],
    to: string,
    deadline: number
) {
    const router = new ethers.Contract(routerAddress, routerAbi, signer);
    const tx = await router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
    return await tx.wait();
}
