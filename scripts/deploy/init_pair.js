const { ethers } = require("hardhat");

async function main() {
  const pairAddr = "0xA77f46bbe153e8508D45E8C096c136643aE08994";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const pair = await ethers.getContractAt([
    "function initialize(address, address) external"
  ], pairAddr);

  const [token0, token1] = wdnr < usdck ? [wdnr, usdck] : [usdck, wdnr];

  console.log("⚙️ INITIALIZING GENESIS PAIR...");
  console.log(`Pair:    ${pairAddr}`);
  console.log(`Token0:  ${token0}`);
  console.log(`Token1:  ${token1}`);

  const tx = await pair.initialize(token0, token1);
  console.log("⏳ Waiting for on-chain initialization...");
  await tx.wait();
  console.log("✅ PAIR IS NOW LIVE AND INITIALIZED.");

  // Proceed directly to seeding
  console.log("\n🌊 PROCEEDING TO $215.92 SEEDING...");
}

main().catch(console.error);
