const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const routerAddr = "0x03Aa1c0f91ac15275D0C6FC36f9F8b5773900106"; 

  const Router = new ethers.Contract(routerAddr, [
    "function getQuote(uint256 amountIn) public pure returns (uint256)"
  ], provider);

  const amountIn = ethers.parseUnits("80", 18);
  console.log("Querying high-speed quote for 80 DNR...");
  try {
    const amount = await Router.getQuote(amountIn);
    console.log("SUCCESS! Result:", ethers.formatUnits(amount, 18), "USDC.k");
  } catch (err) {
    console.error("FAIL! Error:", err.message);
  }
}

main().catch(console.error);
