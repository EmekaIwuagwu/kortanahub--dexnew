const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const UDNR = "0x5Ceb319A678E630e2D506F1B0873d3886b671777";
  const SUSDC = "0xA5B3bc462c76d39d7f23aAB7Ef97f62c233d43A0";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000, chainId: 9002 };

  console.log("--- 🏛️ KORTANA HYPER-SWAP FINAL AUDIT ---");

  // 1. Deploy
  const Factory = await ethers.getContractFactory("SovereignHyperSwap", wallet);
  const swap = await Factory.deploy(UDNR, SUSDC, PARAMS);
  await swap.waitForDeployment();
  const addr = await swap.getAddress();
  console.log(`✅ Hyper-Swap Live: ${addr}`);

  // 2. Setup
  const token = new ethers.Interface(["function transfer(address,uint256) returns (bool)", "function approve(address,uint256) returns (bool)"]);
  const abi = new ethers.Interface(["function buyDNR(uint256)"]);

  console.log("[1] Seeding DNR...");
  await (await wallet.sendTransaction({ to: UDNR, data: token.encodeFunctionData("transfer", [addr, ethers.parseEther("100.0")]), ...PARAMS })).wait();

  console.log("[2] Trading: Price Growth (Buy DNR with USDC.k)...");
  await (await wallet.sendTransaction({ to: SUSDC, data: token.encodeFunctionData("approve", [addr, ethers.parseEther("1.0")]), ...PARAMS })).wait();

  const tx = await wallet.sendTransaction({ to: addr, data: abi.encodeFunctionData("buyDNR", [ethers.parseEther("0.1")]), ...PARAMS });
  const r = await tx.wait();

  console.log(`\n🏁 FINAL STATUS: ${r.status === 1 ? '✅ SUCCESS' : '❌ REVERT'}`);
  console.log(`TX HASH: ${tx.hash}`);
}

main().catch(console.error);
