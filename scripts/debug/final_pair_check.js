const { ethers } = require("hardhat");

async function main() {
  const factoryAddr = "0x144d2659363c643D1bCf5F4958c2aBB2a51a258C";
  const wdnrAddr = "0xABa74d3376984817d8739E3Ec2B99d3b6Ed8E481";
  const usdckAddr = "0x661BE53c9f5B77C075c0F9E0680260285846F9CA";

  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const factory = new ethers.Contract(factoryAddr, ["function getPair(address, address) view returns (address)"], provider);

  const pair = await factory.getPair(wdnrAddr, usdckAddr);
  console.log(`OFFICIAL PAIR: ${pair}`);
}

main().catch(console.error);
