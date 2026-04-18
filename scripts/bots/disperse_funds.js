const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const botConfig = JSON.parse(fs.readFileSync("./config/bot_wallets.json"));
  const [deployer] = await ethers.getSigners();
  
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";
  const usdckContract = await ethers.getContractAt("IERC20", usdck);

  console.log(`\n--- 💸 SEED DISPERSION INITIATED ---`);
  console.log(`Funding source: ${deployer.address}`);

  const totalUsdcNeeded = ethers.parseUnits("7000", 18);
  const usdcPerWallet = ethers.parseUnits("700", 18);
  const gasPerWallet = ethers.parseUnits("10", 18);

  const adminBalance = await usdckContract.balanceOf(deployer.address);
  if (adminBalance < totalUsdcNeeded) {
      console.log(`❌ ERROR: Admin only has $${ethers.formatUnits(adminBalance, 18)}. Need $7,000.`);
      return;
  }

  for (const wallet of botConfig.fleet) {
    console.log(`\nFunding Wallet: ${wallet.address}`);
    
    // 1. Send USDC.k
    const t1 = await usdckContract.transfer(wallet.address, usdcPerWallet, { type: 0 });
    await t1.wait();
    console.log(`✅ Sent $700 USDC.k`);

    // 2. Send Native DNR (Gas)
    const t2 = await deployer.sendTransaction({
        to: wallet.address,
        value: gasPerWallet,
        type: 0
    });
    await t2.wait();
    console.log(`✅ Sent 10 DNR (Gas)`);
  }

  console.log(`\n💎 ALL RETAIL WALLETS ARE FUNDED AND READY.`);
}

main().catch(console.error);
