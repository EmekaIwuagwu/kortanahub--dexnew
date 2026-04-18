const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const abi = ["function deposit() payable", "function balanceOf(address) view returns (uint256)"];
  const WDNR = new ethers.Contract(wdnrAddr, abi, wallet);

  console.log(`Wrapping 1 DNR...`);
  try {
      const tx = await WDNR.deposit({ value: ethers.parseEther("1"), type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 1000000 });
      console.log(`Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Success!`);
      const bal = await WDNR.balanceOf(wallet.address);
      console.log(`New Balance: ${ethers.formatUnits(bal, 18)} WDNR`);
  } catch (e) {
      console.error(`FAILED: ${e.message}`);
  }
}

main().catch(console.error);
