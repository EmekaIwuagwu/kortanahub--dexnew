const { ethers } = require("hardhat");

async function main() {
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const [deployer] = await ethers.getSigners();
  
  console.log(`🚀 SIMULATING PRICE ANCHOR...`);
  console.log(`Signer: ${deployer.address}`);

  const wdnrContract = await ethers.getContractAt([
      "function deposit() payable"
  ], wdnr);

  const amount = ethers.parseUnits("1", 18);

  console.log("Step 1: Simulating WDNR.deposit()...");
  try {
      // simulate using staticCall
      await wdnrContract.deposit.staticCall({ value: amount });
      console.log("✅ SIMULATION SUCCESS: Deposit logic is valid.");
  } catch (err) {
      console.log("❌ SIMULATION FAILED: Revealing reason...");
      if (err.data) console.log(`Data: ${err.data}`);
      if (err.message) console.log(`Message: ${err.message}`);
      
      // Try to decode the error manually
      console.log("\nDecoded Error Analysis:");
      console.log(err);
  }
}

main().catch(console.error);
