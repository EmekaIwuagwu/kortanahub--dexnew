const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const botConfig = JSON.parse(fs.readFileSync("./config/bot_wallets.json"));
  const [deployer] = await ethers.getSigners();
  
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";
  const routerAddr = "0x17e98D09BB86DF8Bff55d95D1A2bb4601fBaf309";

  console.log(`\n--- 🚀 KORTANA VELOCITY BOT ACTIVE ---`);
  
  const router = await ethers.getContractAt([
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
  ], routerAddr);

  // TRADING LOOP
  while (true) {
    // 1. Select a random wallet from the fleet
    const walletData = botConfig.fleet[Math.floor(Math.random() * botConfig.fleet.length)];
    const wallet = new ethers.Wallet(walletData.privateKey, ethers.provider);
    
    console.log(`\n[${new Date().toLocaleTimeString()}] 👤 Active Wallet: ${wallet.address}`);

    try {
        const usdckContract = await ethers.getContractAt("IERC20", usdck, wallet);
        const balance = await usdckContract.balanceOf(wallet.address);
        
        if (balance > ethers.parseUnits("50", 18)) {
            // Randomly decide buy amount ($50 - $150)
            const buyAmount = ethers.parseUnits((Math.random() * 100 + 50).toFixed(2), 18);
            
            console.log(`📈 Action: BUY DNR ($${ethers.formatUnits(buyAmount, 18)})`);
            
            // Approve router
            await (await usdckContract.approve(routerAddr, buyAmount)).wait();
            
            // Swap USDC -> DNR
            const path = [usdck, wdnr];
            const deadline = Math.floor(Date.now() / 1000) + 600;
            
            const tx = await router.connect(wallet).swapExactTokensForTokens(
                buyAmount,
                0, // 0 for testnet, on mainnet we check slippage
                path,
                wallet.address,
                deadline,
                { gasLimit: 500000, type: 0 }
            );
            
            console.log(`✅ Trade Confirmed: ${tx.hash}`);
        } else {
            console.log(`💤 Wallet empty ($${ethers.formatUnits(balance, 18)}). Skipping...`);
        }
    } catch (err) {
        console.log(`⚠️ Trade Failed: ${err.message}`);
    }

    // 2. Random Sleep (1 - 3 minutes)
    const sleepSecs = Math.floor(Math.random() * 120 + 60);
    console.log(`⏳ Sleeping for ${sleepSecs}s to maintain organic pattern...`);
    await new Promise(r => setTimeout(r, sleepSecs * 1000));
  }
}

main().catch(console.error);
