const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);
  const SUSDC = "0xA5B3bc462c76d39d7f23aAB7Ef97f62c233d43A0";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 8000000, chainId: 9002 };

  console.log("--- 🏛️ KORTANA PRICE GROWTH FINAL VERIFICATION ---");

  // 1. Deploy
  const Factory = await ethers.getContractFactory("NativeSovereignPatch", wallet);
  const patch = await Factory.deploy(SUSDC, PARAMS);
  await patch.waitForDeployment();
  const addr = await patch.getAddress();
  console.log(`✅ Anchor Live: ${addr}`);

  // 2. Seed
  const uIface = new ethers.Interface(["function transfer(address,uint256) returns (bool)", "function approve(address,uint256) returns (bool)"]);
  const aIface = new ethers.Interface(["function depositDNR() payable", "function buyDNR(uint256,uint256,address)"]);

  console.log("[1] Seeding DNR...");
  await (await wallet.sendTransaction({ to: addr, data: aIface.encodeFunctionData("depositDNR"), value: ethers.parseEther("0.1"), ...PARAMS })).wait();
  
  console.log("[2] Seeding USDC...");
  await (await wallet.sendTransaction({ to: SUSDC, data: uIface.encodeFunctionData("transfer", [addr, ethers.parseEther("50.0")]), ...PARAMS })).wait();
  
  console.log("[3] Trading: Growing Price (Buy DNR)...");
  await (await wallet.sendTransaction({ to: SUSDC, data: uIface.encodeFunctionData("approve", [addr, ethers.parseEther("1.0")]), ...PARAMS })).wait();
  
  const tx = await wallet.sendTransaction({ to: addr, data: aIface.encodeFunctionData("buyDNR", [ethers.parseEther("0.1"), 0, wallet.address]), ...PARAMS });
  const r = await tx.wait();

  console.log(`\n🏁 FINAL STATUS: ${r.status === 1 ? '✅ SUCCESS' : '❌ REVERT'}`);
  console.log(`TX HASH: ${tx.hash}`);
  console.log(`BLOCK: ${r.blockNumber}`);
}

main().catch(console.error);
