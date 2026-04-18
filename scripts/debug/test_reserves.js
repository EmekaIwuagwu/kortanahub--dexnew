const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const pairAddr = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242"; 

  const Pair = new ethers.Contract(pairAddr, [
    "function getReserves() view returns (uint256, uint256, uint32)"
  ], provider);

  try {
     const reserves = await Pair.getReserves();
     console.log("SUCCESS! Pair Reserves:", reserves[0].toString(), reserves[1].toString());
  } catch (err) {
     console.error("FAIL! Reserves Read Failed:", err.message);
  }
}

main().catch(console.error);
