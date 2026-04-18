import { ethers } from "ethers";

const routerAbi = [
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)",
    "function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)"
];

const mockERC20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

export async function addLiquidity(
    signer: ethers.Signer,
    routerAddress: string,
    tokenA: string,
    tokenB: string,
    amountADesired: bigint,
    amountBDesired: bigint,
    amountAMin: bigint,
    amountBMin: bigint,
    to: string,
    deadline: number
) {
    const router = new ethers.Contract(routerAddress, routerAbi, signer);

    // Provide standard approval checking before calling router (in frontend this might be separate)
    const tA = new ethers.Contract(tokenA, mockERC20Abi, signer);
    const tB = new ethers.Contract(tokenB, mockERC20Abi, signer);

    const address = await signer.getAddress();
    
    if (await tA.allowance(address, routerAddress) < amountADesired) {
        await (await tA.approve(routerAddress, ethers.MaxUint256)).wait();
    }
    if (await tB.allowance(address, routerAddress) < amountBDesired) {
        await (await tB.approve(routerAddress, ethers.MaxUint256)).wait();
    }

    const tx = await router.addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline);
    return await tx.wait();
}
