const crypto = require('crypto');

const getRandomAmount = (min, max) => {
    const range = max - min;
    const randomFraction = crypto.randomInt(0, 1000000) / 1000000;
    const amount = min + (range * randomFraction);
    return parseFloat(amount.toFixed(2));
};

const getRandomDelay = (minSeconds, maxSeconds) => {
    const baseDelay = crypto.randomInt(minSeconds, maxSeconds + 1);
    const microDelay = crypto.randomInt(0, 16);
    return (baseDelay + microDelay) * 1000;
};

const getWeightedChance = (percent) => {
    return crypto.randomInt(0, 101) <= percent;
};

module.exports = {
    getRandomAmount,
    getRandomDelay,
    getWeightedChance
};
