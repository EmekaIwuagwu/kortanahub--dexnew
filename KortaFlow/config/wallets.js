require('dotenv').config();

const getWallets = () => {
    const keys = [];
    let i = 1;
    while (process.env[`WALLET_${i}`]) {
        keys.push(process.env[`WALLET_${i}`]);
        i++;
    }
    return keys;
};

module.exports = {
    walletKeys: getWallets()
};
