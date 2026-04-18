const { ethers } = require("hardhat");

async function main() {
  const treasuryKey = "0x0ce974795717622ea3c0429e580a4e25a71585a389e05b7f87167b87b5ff65d4";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const treasury = new ethers.Wallet(treasuryKey, provider);
  
  const walletKeys = [
    "0xa55c21b10fb883ee620a9b76ee8592f0190b26c79fa85ba5b63a2139093838c1", // #7
    "0xc8930c61c5339d9b03225c3d5d3f0f214ad6bb485fc8c4179ffac3bb33c6ba95", // #8
    "0x174f755bab86affd9f226efb0b44b069133f7b0d38372cfa40c1e0e177782e8a", // #9
    "0x79315fe7e11a1de917ae6eae61d518df2614276d694c595d77d30bb8991d7fb6", // #10
    "0x51b7b8d563d0ae5989fd61e6cacc079cfc302b4f96de99bf79cce9296fc9323e"  // #11
  ];

  const DNR_AMOUNT = ethers.parseUnits("200000", 18);

  console.log(`Starting FINAL DNR SATURATION for remaining 5 Wallets...`);
  let nonce = await provider.getTransactionCount(treasury.address);

  for (let i = 0; i < walletKeys.length; i++) {
    const target = new ethers.Wallet(walletKeys[i]).address;
    console.log(`\n[Refuel #${i + 7}] Target: ${target} (Nonce: ${nonce})`);
    
    try {
      const tx = await treasury.sendTransaction({
        to: target,
        value: DNR_AMOUNT,
        nonce: nonce++,
        type: 0,
        gasPrice: 1,
        gasLimit: 30000
      });
      console.log(`✅ DNR Sent: ${tx.hash}`);
      await tx.wait();
    } catch (e) {
      console.log(`❌ DNR Failed: ${e.message}`);
    }
  }

  console.log(`\nFINAL DNR SATURATION COMPLETE.`);
}

main().catch(console.error);
