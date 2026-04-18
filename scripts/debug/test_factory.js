const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const factoryAddr = "0xe673aa0a79DC71a0c458b43d51222121c49FBe67";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const Factory = new ethers.Contract(factoryAddr, [
    "function getPair(address tokenA, address tokenB) view returns (address pair)"
  ], provider);

  const pairAddr = await Factory.getPair(wdnrAddr, usdcAddr);
  console.log("Registered Pair in Factory:", pairAddr);
}

main().catch(console.error);
