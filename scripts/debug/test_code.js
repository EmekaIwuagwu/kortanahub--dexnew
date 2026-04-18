const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const routerAddr = "0xf30DBA8239777ad3074E5979c4C010c208999140"; 
  const code = await provider.getCode(routerAddr);
  console.log("Bytecode Length:", code.length);
  if (code === "0x") {
    console.log("FAIL! No contract at this address.");
  } else {
    console.log("SUCCESS! Contract manifested. Head:", code.substring(0, 50));
  }
}

main().catch(console.error);
