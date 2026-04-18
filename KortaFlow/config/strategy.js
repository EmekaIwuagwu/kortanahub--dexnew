require('dotenv').config();

module.exports = {
    minDnrTrade: parseFloat(process.env.MIN_DNR_TRADE || '1.0'),
    maxDnrTrade: parseFloat(process.env.MAX_DNR_TRADE || '15.0'),
    minUsdckTrade: parseFloat(process.env.MIN_USDCK_TRADE || '0.5'),
    maxUsdckTrade: parseFloat(process.env.MAX_USDCK_TRADE || '10.0'),
    minDelaySeconds: parseInt(process.env.MIN_DELAY_SECONDS || '30'),
    maxDelaySeconds: parseInt(process.env.MAX_DELAY_SECONDS || '300'),
    maxGasGwei: parseInt(process.env.MAX_GAS_GWEI || '100'),
    minDnrBalance: parseFloat(process.env.MIN_DNR_BALANCE || '5.0'),
    minUsdckBalance: parseFloat(process.env.MIN_USDCK_BALANCE || '5.0'),
    dailyVolumeCapDnr: parseFloat(process.env.DAILY_VOLUME_CAP_DNR || '10000')
};
