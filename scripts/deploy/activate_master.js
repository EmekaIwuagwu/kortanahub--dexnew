const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const botConfig = JSON.parse(fs.readFileSync("./config/bot_wallets.json"));
  const masterAddr = botConfig.master.address;
  
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";
  const usdckContract = await ethers.getContractAt("IERC20", usdck);

  console.log(`\n--- 🏛️ MAINNET IDENTITY ACTIVATION ---`);
  console.log(`Step 1: Funding Master Identity for $215.92 Seeding...`);

  // Fund Master with 7500 USDC.k (7000 for retail, 500 reserve)
  const amount = ethers.parseUnits("7500", 18);
  const gas = ethers.parseUnits("500", 18); // DNR for gas

  console.log(`- Sending $7,500 USDC.k to Master: ${masterAddr}`);
  const t1 = await usdckContract.transfer(masterAddr, amount, { type: 0 });
  await t1.wait();
  
  console.log(`- Sending 500 DNR Gas to Master: ${masterAddr}`);
  const t2 = await deployer.sendTransaction({
      to: masterAddr,
      value: gas,
      type: 0
  });
  await t2.wait();

  console.log(`\n✅ MASTER IDENTITY IS FUNDED AND AUTHORIZED.`);
  console.log(`\n--- ⚠️ NEXT ACTION: MAINNET DEPLOYMENT ---`);
  console.log(`Identity: 0xC70292a9DC97cF548Fee9839D7696CBAFc951B20`);
}

main().catch(console.error);
