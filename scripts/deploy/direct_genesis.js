const { ethers } = require("hardhat");

async function main() {
  const pairAddr = "0x3548c5486B06c8D83935Cb57b03c1b7CEBfEe32E";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const usdck = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const [deployer] = await ethers.getSigners();
  console.log(`\n💎 DIRECT PRICE ANCHOR sequence starting...`);
  console.log(`Operating Account: ${deployer.address}`);

  const usdckContract = await ethers.getContractAt("IERC20", usdck);
  const wdnrContract = await ethers.getContractAt([
      "function deposit() payable",
      "function transfer(address, uint256) returns (bool)"
  ], wdnr);
  const pair = await ethers.getContractAt([
      "function mint(address) external returns (uint256)",
      "function getReserves() view returns (uint112, uint112, uint32)"
  ], pairAddr);

  // $215.92 Ratio: 1,000 DNR : 215,920 USDC.k
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  // 1. Wrap DNR
  console.log("Step 1: Wrapping 1,000 DNR...");
  const depTx = await wdnrContract.deposit({ value: dnrAmount, type: 0 });
  await depTx.wait();

  // 2. Transfer Assets
  console.log("Step 2: Sending assets to the Vault...");
  const t1 = await wdnrContract.transfer(pairAddr, dnrAmount, { type: 0 });
  await t1.wait();
  const t2 = await usdckContract.transfer(pairAddr, usdcAmount, { type: 0 });
  await t2.wait();
  console.log("✅ Assets locked in vault.");

  // 3. Activate Market (Mint LP)
  console.log("Step 3: Activating Market Pricing...");
  const mintTx = await pair.mint(deployer.address, { gasLimit: 2000000, type: 0 });
  const receipt = await mintTx.wait();
  
  console.log(`✅ GENESIS SUCCESS! Tx: ${receipt.hash}`);
  
  // 4. Final Verification
  const reserves = await pair.getReserves();
  const r0 = Number(ethers.formatUnits(reserves[0], 18));
  const r1 = Number(ethers.formatUnits(reserves[1], 18));
  const price = r1 / r0;
  
  console.log(`\n💎 FINAL REPORT: 1 DNR = $${price.toFixed(4)} USDC.k`);
}

main().catch(console.error);
