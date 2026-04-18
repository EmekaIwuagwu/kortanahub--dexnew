const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 30000, chainId: 9002 };

  console.log("--- 🏛️ KORTANA WALLET POOL FUNDING CYCLE ---");

  // 1. Generate Wallets
  const pool = [];
  for (let i = 0; i < 11; i++) {
    const w = ethers.Wallet.createRandom();
    pool.push(w);
    console.log(`[GENERATED] Wallet #${i + 1}: ${w.address}`);
  }

  // 2. Fund Wallets
  console.log("\n[DISTRIBUTION] Batch Funding 10,000 DNR each...");
  for (let i = 0; i < pool.length; i++) {
    const tx = await wallet.sendTransaction({
      to: pool[i].address,
      value: ethers.parseEther("10000.0"),
      ...PARAMS
    });
    await tx.wait();
    console.log(`   [CONFIRMED] Wallet #${i + 1} Funded. Tx: ${tx.hash}`);
  }

  // 3. Update .env
  console.log("\n[CONFIG] Locking credentials into KortaFlow/.env...");
  let envContent = `KORTANA_RPC_URL=https://zeus-rpc.mainnet.kortana.xyz\n`;
  envContent += `CHAIN_ID=9002\n`;
  envContent += `DEX_ROUTER_ADDRESS=0x478EE00b96D1e9f829fc50889aD97C2d500feC2D\n`;
  envContent += `DNR_TOKEN_ADDRESS=0xE4a96A5e9615BC803F15A44B7aB956AA450E446B\n`;
  envContent += `USDCK_TOKEN_ADDRESS=0x32E3610bcc0DfD81E5246b8f6740bcCf0F82F709\n`;
  envContent += `EXPLORER_BASE_URL=https://explorer.mainnet.kortana.xyz\n\n`;
  
  envContent += `# Wallets Pool\n`;
  pool.forEach((w, idx) => {
    envContent += `WALLET_${idx + 1}=${w.privateKey}\n`;
  });

  envContent += `\n# Trade Strategy\n`;
  envContent += `MIN_DNR_TRADE=1.0\n`;
  envContent += `MAX_DNR_TRADE=15.0\n`;
  envContent += `MIN_USDCK_TRADE=0.5\n`;
  envContent += `MAX_USDCK_TRADE=10.0\n`;
  envContent += `MIN_DELAY_SECONDS=30\n`;
  envContent += `MAX_DELAY_SECONDS=300\n`;
  envContent += `MAX_GAS_GWEI=100\n`;
  envContent += `MIN_DNR_BALANCE=5.0\n`;
  envContent += `MIN_USDCK_BALANCE=5.0\n`;
  envContent += `DAILY_VOLUME_CAP_DNR=100000\n`;

  fs.writeFileSync(path.join(__dirname, "../../KortaFlow/.env"), envContent);
  console.log("🏁 SUCCESS: 11 Wallets Funded and Environment Locked.");
}

main().catch(console.error);
