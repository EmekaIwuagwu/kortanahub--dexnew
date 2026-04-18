const winston = require('winston');
const chalk = require('chalk');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../logs/trades.json') }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    let coloredMessage = message;
                    if (message.includes('✅')) coloredMessage = chalk.green(message);
                    else if (message.includes('❌')) coloredMessage = chalk.red(message);
                    else if (message.includes('⚠️')) coloredMessage = chalk.yellow(message);
                    else if (message.includes('ℹ️')) coloredMessage = chalk.blue(message);
                    
                    return `[${timestamp}] ${coloredMessage}`;
                })
            )
        })
    ]
});

module.exports = logger;
