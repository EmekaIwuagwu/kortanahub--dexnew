const { ethers } = require("hardhat");

async function main() {
  const pairAddress = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242";
  const abi = [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
  ];
  const Pair = new ethers.Contract(pairAddress, abi, ethers.provider);

  console.log(`Checking reserves on ${pairAddress}...`);
  try {
    const res = await Pair.getReserves();
    console.log(`SUCCESS! R0: ${res[0]}, R1: ${res[1]}`);
  } catch (e) {
    console.error(`FAILED: ${e.message}`);
  }
}

main().catch(console.error);
