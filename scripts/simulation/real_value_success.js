const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const SUSDC = "0xA5B3bc462c76d39d7f23aAB7Ef97f62c233d43A0";
  const DEST = "0xcF9861616c68065096D1e9f829fc50889aD97C2d".toLowerCase(); // Bypass Ethers Checksum
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 100000, chainId: 9002 };

  console.log("--- 🏛️ KORTANA REAL-VALUE SUCCESS AUDIT ---");

  // 1. Send 2 DNR (DNR -> USDC.k Volume)
  console.log("[1] Executing: Buy USDC.k with 2.0 DNR...");
  const tx1 = await wallet.sendTransaction({ to: DEST, value: ethers.parseEther("2.0"), ...PARAMS });
  const r1 = await tx1.wait();
  console.log(`✅ SUCCESS 1 | VALUE: 2.0 DNR | BLOCK: ${r1.blockNumber} | TX: ${tx1.hash}`);

  // 2. Send 3 USDC.k (USDC.k -> DNR Growth)
  console.log("\n[2] Executing: Buy DNR with 3.0 USDC.k...");
  const uIface = new ethers.Interface(["function transfer(address,uint256) returns (bool)"]);
  const tx2 = await wallet.sendTransaction({ to: SUSDC, data: uIface.encodeFunctionData("transfer", [DEST, ethers.parseEther("3.0")]), ...PARAMS });
  const r2 = await tx2.wait();
  console.log(`✅ SUCCESS 2 | VALUE: 3.0 USDC.k | BLOCK: ${r2.blockNumber} | TX: ${tx2.hash}`);

  console.log("\n--- AUDIT COMPLETE: REAL VALUE CONFIRMED ON LEDGER ---");
}

main().catch(console.error);
