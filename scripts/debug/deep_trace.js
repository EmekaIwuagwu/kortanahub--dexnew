const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const factoryAddr = "0x5A5c7889349dDaf262A8F2830e6AB61Cb2191ec0";
  const routerAddr = "0x0b8Ea2d065c71B46d1A4A30A1224687D06eBe19B";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const Router = new ethers.Contract(routerAddr, ["function factory() view returns (address)"], provider);
  const routerFactory = await Router.factory();
  console.log("Router Factory:", routerFactory);
  console.log("Expected Factory:", factoryAddr);

  const Factory = new ethers.Contract(factoryAddr, ["function getPair(address,address) view returns (address)"], provider);
  const pair = await Factory.getPair(wdnrAddr, usdcAddr);
  console.log("Pair from Factory:", pair);

  if (pair !== "0x0000000000000000000000000000000000000000") {
    const Pair = new ethers.Contract(pair, [
      "function getReserves() view returns (uint256, uint256, uint32)",
      "function token0() view returns (address)"
    ], provider);
    const reserves = await Pair.getReserves();
    const token0 = await Pair.token0();
    console.log("Pair Token0:", token0);
    console.log("Pair Reserves:", reserves[0].toString(), reserves[1].toString());
  }
}

main().catch(console.error);
