const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdc, wallet);

  console.log(`Checking USDC.k balance...`);
  const bal = await token.balanceOf(wallet.address);
  console.log(`Balance: ${ethers.formatUnits(bal, 18)} USDC.k`);

  if (bal > 0n) {
      console.log(`Testing Transfer...`);
      const tx = await token.transfer(wallet.address, 1n, { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 500000 });
      console.log(`Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Transfer WORKED!`);
  }
}

main().catch(console.error);
