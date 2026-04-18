const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  // Normalize everything
  const FACTORY_ADDR = ethers.getAddress("0x429E57252Cf186E91F99da5634789Bc591a351De".toLowerCase());
  const PAIR_ADDR = ethers.getAddress("0x6479f649C9373D6B9eD49405F79fdCb12040ca38".toLowerCase());
  const WDNR = ethers.getAddress("0xEB7EAf34FDC051191F99DA56c4DFa267C562aEBA".toLowerCase());

  const pair = new ethers.Contract(PAIR_ADDR, [
    "function token0() view returns (address)",
    "function token1() view returns (address)"
  ], provider);

  const t0 = await pair.token0();
  const t1 = await pair.token1();

  const realUSDCk = t0.toLowerCase() === WDNR.toLowerCase() ? t1 : t0;

  console.log(`\n--- 🏛️ KORTANADEX RECOVERY ---`);
  console.log(`FACTORY: ${FACTORY_ADDR}`);
  console.log(`WDNR:    ${WDNR}`);
  console.log(`PAIR:    ${PAIR_ADDR}`);
  console.log(`\n💎 RECOVERED USDC.k: ${realUSDCk}`);
}

main().catch(console.error);
