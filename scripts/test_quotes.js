const { ethers } = require("hardhat");

async function main() {
  const routerAddress = "0x17e98D09BB86DF8Bff55d95D1A2bb4601fBaf309";
  const wdnr = "0x508EC555730af000FfDB413FcC37ae899C3442f4";
  const kortusd = "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826";

  const Router = await ethers.getContractAt([
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
  ], routerAddress);

  console.log("Checking quotes for 1 DNR...");
  try {
      const path = [wdnr, kortusd];
      const amountIn = ethers.parseEther("1.0");
      const amounts = await Router.getAmountsOut(amountIn, path);
      console.log(`✅ Success! 1 DNR = ${ethers.formatEther(amounts[1])} KORTUSD`);
  } catch (e) {
      console.error("❌ Failed to get quote:", e.message);
  }
}

main().catch(console.error);
