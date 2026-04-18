const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const pairAddr = "0x49B25560B081d2912b5eB08062e01B42692A539a";

  const pair = new ethers.Contract(pairAddr, [
    "function getReserves() view returns (uint256, uint256, uint32)",
    "function totalSupply() view returns (uint256)"
  ], provider);

  const [reserve0, reserve1] = await pair.getReserves();
  const totalSupply = await pair.totalSupply();
  
  console.log("Reserves:", reserve0.toString(), reserve1.toString());
  console.log("TotalSupply:", totalSupply.toString());
}

main().catch(console.error);
