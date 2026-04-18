const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const UDNR = "0x5Ceb319A678E630e2D506F1B0873d3886b671777";
  const SUSDC = "0xA5B3bc462c76d39d7f23aAB7Ef97f62c233d43A0";
  const MIRROR = "0x383DBA93793aFD289879dAa95b2c0Bccb79108C9";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000, chainId: 9002 };

  const token = new ethers.Interface(["function transfer(address,uint256) returns (bool)", "function deposit() payable"]);
  const abi = new ethers.Interface(["function swap(uint256,uint256,address)", "function sync()"]);

  console.log("--- 🏛️ KORTANA FINAL DUAL-DIRECTION SUCCESS AUDIT ---");

  // 1. DNR -> USDC.k
  console.log("[1] Testing: DNR -> USDC.k...");
  await (await wallet.sendTransaction({ to: UDNR, data: token.encodeFunctionData("deposit"), value: ethers.parseEther("0.01"), ...PARAMS })).wait();
  await (await wallet.sendTransaction({ to: UDNR, data: token.encodeFunctionData("transfer", [MIRROR, ethers.parseEther("0.01")]), ...PARAMS })).wait();
  await (await wallet.sendTransaction({ to: MIRROR, data: abi.encodeFunctionData("sync"), ...PARAMS })).wait();

  const tx1 = await wallet.sendTransaction({ to: MIRROR, data: abi.encodeFunctionData("swap", [0, ethers.parseEther("1.0"), wallet.address]), ...PARAMS });
  const r1 = await tx1.wait();
  console.log(`✅ SUCCESS 1 (DNR to USDC): ${tx1.hash} | Block: ${r1.blockNumber}`);

  // 2. USDC.k -> DNR
  console.log("\n[2] Testing: USDC.k -> DNR...");
  await (await wallet.sendTransaction({ to: SUSDC, data: token.encodeFunctionData("transfer", [MIRROR, ethers.parseEther("10.0")]), ...PARAMS })).wait();
  await (await wallet.sendTransaction({ to: MIRROR, data: abi.encodeFunctionData("sync"), ...PARAMS })).wait();

  const tx2 = await wallet.sendTransaction({ to: MIRROR, data: abi.encodeFunctionData("swap", [ethers.parseEther("0.001"), 0, wallet.address]), ...PARAMS });
  const r2 = await tx2.wait();
  console.log(`✅ SUCCESS 2 (USDC to DNR): ${tx2.hash} | Block: ${r2.blockNumber}`);

  console.log("\n--- AUDIT COMPLETE: ALL DIRECTIONS SUCCESSFUL ---");
}

main().catch(console.error);
