const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const routerAddr = "0x2a65872854c98c06BEA3da4CCCA4c68B87d9089a";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  // Simulate call without ethers wrapper mapping
  const tx = {
    to: routerAddr,
    data: "0xd06ca61f000000000000000000000000000000000000000000000004563918244f40000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000259f3561fe751157458cfbd3a6eb149c321c45a500000000000000000000000028420e30857ae2340ca3127bb2539e3d0d767194"
  };

  try {
     const result = await provider.call(tx);
     console.log("Raw Result:", result);
  } catch (error) {
     console.log("Error Call Revert Info:", error.info);
     console.log("Error Full:", error);
  }
}

main().catch(console.error);
