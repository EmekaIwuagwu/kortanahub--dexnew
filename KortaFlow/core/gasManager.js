const { ethers } = require('ethers');
const network = require('../config/network');
const strategy = require('../config/strategy');

const getGasPrice = async (provider) => {
    try {
        const feeData = await provider.getFeeData();
        // Kortana Mainnet logic: prefer 1 wei (standard) or dynamic if needed
        let price = feeData.gasPrice || 1n;
        
        // Add 10% buffer
        price = (price * 110n) / 100n;
        
        const gwei = ethers.formatUnits(price, 'gwei');
        if (parseFloat(gwei) > strategy.maxGasGwei) {
            throw new Error(`HIGH_GAS: ${gwei} Gwei exceeds limit`);
        }
        
        return price;
    } catch (error) {
        return 1n; // Default to 1 wei on Kortana Zeus
    }
};

module.exports = {
    getGasPrice
};
