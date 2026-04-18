const { ethers } = require("hardhat");

async function main() {
  const CONTRACTS = {
    FACTORY: "0x2e29B9b6c2945710A9444E71fBFd3472AfF325f5",
    ROUTER: "0x17e98D09BB86DF8Bff55d95D1A2bb4601fBaf309",
    KORTUSD: "0xBC24521F3a6c0065B4c7B5198E56A8bC3480e826",
    WDNR: "0x508EC555730af000FfDB413FcC37ae899C3442f4",
    STABILIZER: "0x180d6087D4fE06B2c16B2e79a0671156A0a25ba7",
    BRIDGE: "0xF444f964565030b6a6804B13B1846d198CA546c9",
    FARM: "0x71B8811537557a4292F6C703Ef3f6f0c7806f1a4",
    TOKEN_FACTORY: "0xAD188dff67EAD5F21B0D6CE0E7711D8Db8C76CFd",
    LIQUIDITY_MANAGER: "0xF8C55806737454064Ef62531a99B047DeE81f5e5",
  };

  const [deployer] = await ethers.getSigners();
  console.log(`\n--- 🏛️ KORTANA PROTOCOL STATE AUDIT ---`);
  console.log(`Operating Account: ${deployer.address}\n`);

  for (const [name, addr] of Object.entries(CONTRACTS)) {
    const code = await ethers.provider.getCode(addr);
    const exists = code !== "0x";
    
    let owner = "N/A";
    try {
        const contract = await ethers.getContractAt(["function owner() view returns (address)"], addr);
        owner = await contract.owner();
    } catch (e) {
        try {
            const contract = await ethers.getContractAt(["function feeToSetter() view returns (address)"], addr);
            owner = await contract.feeToSetter() + " (FeeSetter)";
        } catch (e2) {}
    }

    console.log(`${name.padEnd(18)} | ${exists ? "✅ LIVE" : "❌ DEAD"} | Address: ${addr} | Owner: ${owner}`);
  }

  // Deep Dive into the DNR/USDC.k Market
  console.log(`\n--- 📊 MARKET DEPTH AUDIT (DNR/USDC.k) ---`);
  try {
      const factory = await ethers.getContractAt(["function getPair(address,address) view returns (address)"], CONTRACTS.FACTORY);
      const pairAddr = await factory.getPair(CONTRACTS.WDNR, CONTRACTS.KORTUSD);
      console.log(`Official Pair in Current Factory: ${pairAddr}`);

      if (pairAddr !== ethers.ZeroAddress) {
          const pair = await ethers.getContractAt([
              "function getReserves() view returns (uint112,uint112,uint32)",
              "function token0() view returns (address)",
              "function token1() view returns (address)"
          ], pairAddr);
          const reserves = await pair.getReserves();
          const t0 = await pair.token0();
          console.log(`- Token0:  ${t0}`);
          console.log(`- Reserve0: ${ethers.formatUnits(reserves[0], 18)}`);
          console.log(`- Reserve1: ${ethers.formatUnits(reserves[1], 18)}`);
      }
  } catch (err) {
      console.log("❌ Market Audit Failed: Critical path break detected.");
  }
}

main().catch(console.error);
