import { ethers } from "ethers";

const stabilizerAbi = [
    "function mint(uint256 collateralAmount, uint256 minKortusdOut) external",
    "function burn(uint256 kortusdAmount, uint256 minCollateralOut) external",
    "function collateralizationRate() external view returns (uint256)",
    "function collateralToken() external view returns (address)",
    "function kortusd() external view returns (address)"
];

const mockERC20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

export async function mintKORTUSD(
    signer: ethers.Signer,
    stabilizerAddress: string,
    collateralAmount: bigint,
    minKortusdOut: bigint
) {
    const stabilizer = new ethers.Contract(stabilizerAddress, stabilizerAbi, signer);
    const colTokenAddr = await stabilizer.collateralToken();
    const colToken = new ethers.Contract(colTokenAddr, mockERC20Abi, signer);
    
    const address = await signer.getAddress();
    if (await colToken.allowance(address, stabilizerAddress) < collateralAmount) {
        await (await colToken.approve(stabilizerAddress, ethers.MaxUint256)).wait();
    }

    const tx = await stabilizer.mint(collateralAmount, minKortusdOut);
    return await tx.wait();
}

export async function burnKORTUSD(
    signer: ethers.Signer,
    stabilizerAddress: string,
    kortusdAmount: bigint,
    minCollateralOut: bigint
) {
    const stabilizer = new ethers.Contract(stabilizerAddress, stabilizerAbi, signer);
    const kortusdAddr = await stabilizer.kortusd();
    const kortusd = new ethers.Contract(kortusdAddr, mockERC20Abi, signer);
    
    const address = await signer.getAddress();
    if (await kortusd.allowance(address, stabilizerAddress) < kortusdAmount) {
        await (await kortusd.approve(stabilizerAddress, ethers.MaxUint256)).wait();
    }

    const tx = await stabilizer.burn(kortusdAmount, minCollateralOut);
    return await tx.wait();
}
