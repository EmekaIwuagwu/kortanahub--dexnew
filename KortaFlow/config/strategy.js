require('dotenv').config();

module.exports = {
    minDnrTrade: parseFloat(process.env.MIN_DNR_TRADE || '500.0'),
    maxDnrTrade: parseFloat(process.env.MAX_DNR_TRADE || '15000.0'),
    minUsdckTrade: parseFloat(process.env.MIN_USDCK_TRADE || '1000.0'),
    maxUsdckTrade: parseFloat(process.env.MAX_USDCK_TRADE || '8000.0'),
    minDelaySeconds: parseInt(process.env.MIN_DELAY_SECONDS || '3'),
    maxDelaySeconds: parseInt(process.env.MAX_DELAY_SECONDS || '15'),
    maxGasGwei: parseInt(process.env.MAX_GAS_GWEI || '100'),
    minDnrBalance: parseFloat(process.env.MIN_DNR_BALANCE || '50.0'),
    minUsdckBalance: parseFloat(process.env.MIN_USDCK_BALANCE || '20.0'),
    dailyVolumeCapDnr: parseFloat(process.env.DAILY_VOLUME_CAP_DNR || '50000000')
};
