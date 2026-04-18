const { ethers } = require("hardhat");

async function main() {
  const pairAddress = "0x85782446B5ac7c4BcCE639698042e3Ebf46d5242";
  const abi = ["function token0() view returns (address)"];
  const Pair = new ethers.Contract(pairAddress, abi, ethers.provider);

  console.log(`Checking token0 on ${pairAddress}...`);
  try {
    const t0 = await Pair.token0();
    console.log(`SUCCESS! T0: ${t0}`);
  } catch (e) {
    console.error(`FAILED: ${e.message}`);
  }
}

main().catch(console.error);
