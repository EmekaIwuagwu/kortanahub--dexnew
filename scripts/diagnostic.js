const { ethers } = require("hardhat");

async function main() {
  const factoryAddress = "0xb3e6c27f8D234C69bF053d15D7127Df3e774Fb7e";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const kortusd = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const Factory = await ethers.getContractAt([
    "function getPair(address tokenA, address tokenB) view returns (address pair)"
  ], factoryAddress);

  console.log("Checking for pair...");
  const pair = await Factory.getPair(wdnr, kortusd);
  console.log(`Pair Address: ${pair}`);
  
  if (pair === "0x0000000000000000000000000000000000000000") {
      console.log("❌ No pair found! You need to create a liquidity pool first.");
  } else {
      const Pair = await ethers.getContractAt([
          "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
      ], pair);
      const reserves = await Pair.getReserves();
      console.log(`✅ Pair Found! Reserves: ${reserves[0]}, ${reserves[1]}`);
  }
}

main().catch(console.error);
