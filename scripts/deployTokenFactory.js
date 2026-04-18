const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Token Factory with the account:", deployer.address);

  const KortanaTokenFactory = await hre.ethers.getContractFactory("KortanaTokenFactory");
  const factory = await KortanaTokenFactory.deploy();

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("KortanaTokenFactory deployed to:", address);

  // Update the config file
  const configPath = path.join(__dirname, "../config/kortanaTestnet.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  config.contracts.tokenFactory = address;
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Updated config/kortanaTestnet.json with Token Factory address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
