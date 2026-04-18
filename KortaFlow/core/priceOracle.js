const { ethers } = require('ethers');
const network = require('../config/network');

const getDNRPrice = async (provider) => {
    try {
        // ABI for Sovereign Pair getReserves
        const pairAbi = [
            'function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
        ];
        const pair = new ethers.Contract(network.routerAddress, pairAbi, provider);
        
        const reserves = await pair.getReserves();
        // Assuming token0 is DNR and token1 is USDC.k for this display logic
        const price = Number(reserves[1]) / Number(reserves[0]);
        return price.toFixed(6);
    } catch (error) {
        return "N/A";
    }
};

module.exports = {
    getDNRPrice
};
