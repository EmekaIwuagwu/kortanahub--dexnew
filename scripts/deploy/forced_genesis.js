const { ethers } = require("hardhat");

async function main() {
  const pairAddr = "0x3548c5486B06c8D83935Cb57b03c1b7CEBfEe32E";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;

  console.log(`\n💎 FORCED GENESIS SEQUENCE ($215.92)`);
  
  // 1. Force Sync Nonce
  const networkNonce = await provider.getTransactionCount(deployer.address, "latest");
  console.log(`Current Network Nonce: ${networkNonce}`);

  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const wdnrContract = await ethers.getContractAt([
      "function deposit() payable",
      "function transfer(address, uint256) returns (bool)"
  ], wdnr);
  const pair = await ethers.getContractAt([
      "function mint(address) external returns (uint256)"
  ], pairAddr);

  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  // Execute sequence with explicit nonces
  console.log("Step 1: Forcing WDNR Deposit...");
  const tx1 = await wdnrContract.deposit({ value: dnrAmount, nonce: networkNonce, type: 0, gasLimit: 500000 });
  await tx1.wait();
  console.log("✅ WDNR Ready.");

  console.log("Step 2: Transferring WDNR...");
  const tx2 = await wdnrContract.transfer(pairAddr, dnrAmount, { nonce: networkNonce + 1, type: 0, gasLimit: 500000 });
  await tx2.wait();

  console.log("Step 3: Transferring USDC.k...");
  const tx3 = await usdckContract.transfer(pairAddr, usdcAmount, { nonce: networkNonce + 2, type: 0, gasLimit: 500000 });
  await tx3.wait();

  console.log("Step 4: Activating $215.92 Price...");
  const tx4 = await pair.mint(deployer.address, { nonce: networkNonce + 3, type: 0, gasLimit: 2000000 });
  await tx4.wait();

  console.log("\n💎 GEMESIS COMPLETE. 1 DNR = $215.92");
}

main().catch(console.error);
