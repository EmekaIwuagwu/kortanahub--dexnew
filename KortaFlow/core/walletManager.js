const { ethers } = require('ethers');
const wallets = require('../config/wallets');
const strategy = require('../config/strategy');
const network = require('../config/network');

let lastWalletAddress = null;

const getNextWallet = async (provider) => {
    const availableKeys = wallets.walletKeys.filter(key => {
        const wallet = new ethers.Wallet(key);
        return wallet.address !== lastWalletAddress;
    });

    if (availableKeys.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * availableKeys.length);
    const selectedKey = availableKeys[randomIndex];
    const wallet = new ethers.Wallet(selectedKey, provider);

    // Balance check
    const dnrBalance = await provider.getBalance(wallet.address);
    const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
    const usdckContract = new ethers.Contract(network.usdckAddress, erc20Abi, provider);
    const usdckBalance = await usdckContract.balanceOf(wallet.address);

    const dnrVal = parseFloat(ethers.formatEther(dnrBalance));
    const usdckVal = parseFloat(ethers.formatUnits(usdckBalance, 18));

    if (dnrVal < strategy.minDnrBalance || usdckVal < strategy.minUsdckBalance) {
        return { wallet, skip: true, reason: `LOW_BALANCE: DNR ${dnrVal}, USDC.k ${usdckVal}` };
    }

    lastWalletAddress = wallet.address;
    return { wallet, skip: false, balances: { dnr: dnrVal, usdck: usdckVal } };
};

const maskAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

module.exports = {
    getNextWallet,
    maskAddress
};
