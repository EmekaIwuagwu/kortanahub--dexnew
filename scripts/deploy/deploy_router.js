const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [wallet] = await ethers.getSigners();
  const PARAMS = {
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),
    maxFeePerGas: ethers.parseUnits("10", "gwei"),
    gasLimit: 6000000,
  };

  const factory = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  console.log("Deploying Definitive High-Speed Router...");
  const Router = await (await ethers.getContractFactory("KortanaSwapDNR", wallet)).deploy(factory, wdnrAddr, PARAMS);
  await Router.waitForDeployment();
  console.log("ROUTER: ", Router.target);

  const contractsPath = "frontend/src/lib/contracts.ts";
  let content = fs.readFileSync(contractsPath, "utf-8");
  content = content.replace(/ROUTER: "0x[a-fA-F0-9]{40}"/, `ROUTER: "${Router.target}"`);
  fs.writeFileSync(contractsPath, content);
  console.log("Updated contracts.ts!");
}

main().catch(console.error);
