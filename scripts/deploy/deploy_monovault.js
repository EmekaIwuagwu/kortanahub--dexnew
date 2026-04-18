const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 5000000 };

  console.log(`\n--- 🏛️ MONO-VAULT DEPLOYMENT ---`);

  const Vault = await (await ethers.getContractFactory("KortanaMonoVault", wallet)).deploy(PARAMS);
  await Vault.waitForDeployment();
  const vaultAddr = await Vault.getAddress();
  console.log(`✅ MonoVault at: ${vaultAddr}`);

  // Seeding (Using Sovereign USDC.k for test speed)
  const USDC_ADDR = "0x6Fb3C4d6912f6Ac685B5874E8D2A6d381340B080"; 
  const USDC = await ethers.getContractAt("SovereignUSDC", USDC_ADDR, wallet);
  
  console.log("Seeding MonoVault...");
  await (await USDC.transfer(vaultAddr, ethers.parseEther("100"), PARAMS)).wait();
  await (await Vault.seed(ethers.parseEther("100"), { value: ethers.parseEther("1"), ...PARAMS })).wait();

  // Test Swap
  console.log("\n[VERIFICATION] Executing Mono-Vault Swap...");
  const tx = await Vault.buyUSDC({ value: ethers.parseEther("0.1"), ...PARAMS });
  console.log(`Swap TX: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`🏁 MONO-STATUS: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);
}

main().catch(console.error);
