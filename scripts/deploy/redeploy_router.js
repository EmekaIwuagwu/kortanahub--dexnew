const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n🚀 [SENIOR ENGINEER] REDEPLOYING KORTANA SWAP ENGINE...`);

  const factory = "0x1f98e34bF68d282B231D9c7d31FD22a55bE55191";
  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  const PARAMS = { 
    type: 0, 
    gasPrice: ethers.parseUnits("3", "gwei"), 
    gasLimit: 6000000 
  };

  console.log(`Target Factory: ${factory}`);
  console.log(`Target WDNR:    ${wdnr}`);

  // 1. Redeploy KortanaSwapDNR
  console.log("Deploying KortanaSwapDNR...");
  const SwapDNR = await (await ethers.getContractFactory("KortanaSwapDNR", wallet)).deploy(factory, wdnr, PARAMS);
  await SwapDNR.waitForDeployment();
  const swapDnrAddress = await SwapDNR.getAddress();
  console.log(`✅ KortanaSwapDNR deployed to: ${swapDnrAddress}`);

  // 2. Update Frontend Configuration
  const contractsPath = path.join(__dirname, "../../frontend/src/lib/contracts.ts");
  if (fs.existsSync(contractsPath)) {
    let content = fs.readFileSync(contractsPath, "utf-8");
    content = content.replace(/ROUTER: "0x[a-fA-F0-9]{40}"/, `ROUTER: "${swapDnrAddress}"`);
    fs.writeFileSync(contractsPath, content);
    console.log("✅ Updated frontend/src/lib/contracts.ts");
  } else {
    console.warn("⚠️ Frontend contracts.ts not found at " + contractsPath);
  }

  console.log("\n[SUCCESS] Swap Engine manifests at: " + swapDnrAddress);
}

main().catch(console.error);
