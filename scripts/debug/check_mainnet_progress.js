const { ethers } = require("hardhat");

async function main() {
  const masterAddr = "0xC70292a9DC97cF548Fee9839D7696CBAFc951B20";
  const usdckAddr = "0x6D4c3a8440420717b6CA749119739647F6c3997D";

  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const usdck = new ethers.Contract(usdckAddr, ["function balanceOf(address) view returns (uint256)"], provider);

  const bal = await usdck.balanceOf(masterAddr);
  console.log(`USDC.k Balance: ${ethers.formatUnits(bal, 18)}`);
}

main().catch(console.error);
