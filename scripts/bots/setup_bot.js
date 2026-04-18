const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n--- 🤖 KORTANADEX INSTITUTIONALBOT SETUP ---`);
  
  // 1. Create the MASTER MARKET MAKER Account (The one where he sends 200M DNR)
  const masterWallet = ethers.Wallet.createRandom();
  console.log(`\n💎 MASTER MM ACCOUNT (Fund 200M DNR here):`);
  console.log(`Address:     ${masterWallet.address}`);
  console.log(`Private Key: ${masterWallet.privateKey}`);
  
  // 2. Generate RETAIL FLEET (10 Wallets)
  console.log(`\n📦 GENERATING RETAIL FLEET...`);
  const fleet = [];
  for (let i = 0; i < 10; i++) {
    const w = ethers.Wallet.createRandom();
    fleet.push({
      id: i,
      address: w.address,
      privateKey: w.privateKey
    });
    console.log(`Wallet [${i}]: ${w.address}`);
  }

  // 3. Save to Disk (Encrypted/Secure for project use)
  const botState = {
    master: {
      address: masterWallet.address,
      privateKey: masterWallet.privateKey
    },
    fleet: fleet,
    lastUpdate: new Date().toISOString()
  };

  fs.writeFileSync("./config/bot_wallets.json", JSON.stringify(botState, null, 2));
  console.log(`\n✅ BOT INFRASTRUCTURE SAVED TO ./config/bot_wallets.json`);
  
  // 4. Funding Simulation (Preparing for the $7000 USDC dispersion)
  console.log(`\n--- 💸 DISPERSION PLAN ---`);
  console.log(`Total Budget: $7,000 USDC.k`);
  console.log(`Per Wallet:   $700 USDC.k`);
  console.log(`Action:       Randomly purchase DNR to drive Volume & Price.`);
}

main().catch(console.error);
