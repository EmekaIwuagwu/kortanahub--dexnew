// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    kortanaTestnet: {
      url: "https://poseidon-rpc.testnet.kortana.xyz/",
      chainId: 72511,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    kortanaMainnet: {
      url: "https://zeus-rpc.mainnet.kortana.xyz",
      chainId: 9002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      kortanaTestnet: "no-api-key-needed",
      kortanaMainnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "kortanaTestnet",
        chainId: 72511,
        urls: {
          apiURL: "https://explorer.testnet.kortana.xyz/api",
          browserURL: "https://explorer.testnet.kortana.xyz",
        },
      },
      {
        network: "kortanaMainnet",
        chainId: 9002,
        urls: {
          apiURL: "https://explorer.mainnet.kortana.xyz/api",
          browserURL: "https://explorer.mainnet.kortana.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
  },
};
