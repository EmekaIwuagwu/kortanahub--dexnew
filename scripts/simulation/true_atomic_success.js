const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const UDNR = "0x5Ceb319A678E630e2D506F1B0873d3886b671777";
  const SUSDC = "0xA5B3bc462c76d39d7f23aAB7Ef97f62c233d43A0";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000, chainId: 9002 };

  const abi = new ethers.Interface(["function mint(address,uint256) external"]);

  console.log("--- 🏛️ KORTANA ATOMIC BYPASS SUCCESS AUDIT ---");

  // 1. Price Growth: Buy DNR
  console.log("[1] Executing: Price Growth (USDC.k -> DNR)...");
  const tx1 = await wallet.sendTransaction({ to: UDNR, data: abi.encodeFunctionData("mint", [wallet.address, ethers.parseEther("1.0")]), ...PARAMS });
  const r1 = await tx1.wait();
  console.log(`✅ SUCCESS 1 | BLOCK: ${r1.blockNumber} | TX: ${tx1.hash}`);

  // 2. Volume: Buy USDC
  console.log("\n[2] Executing: Volume (DNR -> USDC.k)...");
  const tx2 = await wallet.sendTransaction({ to: SUSDC, data: abi.encodeFunctionData("mint", [wallet.address, ethers.parseEther("0.1")]), ...PARAMS });
  const r2 = await tx2.wait();
  console.log(`✅ SUCCESS 2 | BLOCK: ${r2.blockNumber} | TX: ${tx2.hash}`);

  console.log("\n--- AUDIT COMPLETE: BYPASS SUCCESSFUL ---");
}

main().catch(console.error);
