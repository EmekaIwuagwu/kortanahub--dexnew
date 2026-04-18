require('dotenv').config();

module.exports = {
    rpcUrl: process.env.KORTANA_RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID || '9002'),
    routerAddress: process.env.DEX_ROUTER_ADDRESS,
    dnrAddress: process.env.DNR_TOKEN_ADDRESS,
    usdckAddress: process.env.USDCK_TOKEN_ADDRESS,
    explorerBaseUrl: process.env.EXPLORER_BASE_URL
};
