const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const MONODEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
  const WRAPPER = "0xB848d5d48C9E878B11d122dae61BE9718A48Ed5e";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 5000000 };

  const logFile = "scripts/simulation/dummy_trade.log";
  function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
  }

  fs.writeFileSync(logFile, `--- KORTANA FINAL DUMMY TRADE LOG ---\nTimestamp: ${new Date().toISOString()}\n\n`);

  const dexIface = new ethers.Interface(["function transfer(address to, uint256 val) returns (bool)", "function swapExactDNRForKTUSD(uint256 minOut, address to) payable"]);
  const wrapIface = new ethers.Interface(["function sell(uint256 amount18)"]);

  // Scenario 1 & 2: Buy DNR (Wrapper)
  async function buyDNR(amount, label) {
    log(`\n[SCENARIO] ${label}`);
    const val = ethers.parseEther(amount.toString());
    
    log(`   [1] Transferring to Wrapper...`);
    const tx1 = await wallet.sendTransaction({
        to: MONODEX,
        data: dexIface.encodeFunctionData("transfer", [WRAPPER, val]),
        ...PARAMS
    });
    await tx1.wait();
    log(`   [SUCCESS] Transfer confirmed.`);

    log(`   [2] Executing Sell Wrapper...`);
    const tx2 = await wallet.sendTransaction({
        to: WRAPPER,
        data: wrapIface.encodeFunctionData("sell", [val]),
        ...PARAMS
    });
    const r = await tx2.wait();
    log(`   [SUCCESS] ${label} CONFIRMED. Hash: ${tx2.hash}`);
  }

  // Scenario 3: Buy USDC.k (MonoDEX)
  async function buyUSDC(amount) {
    log(`\n[SCENARIO] Buy USDC.k with DNR`);
    const val = ethers.parseEther(amount.toString());
    const tx = await wallet.sendTransaction({
        to: MONODEX,
        data: dexIface.encodeFunctionData("swapExactDNRForKTUSD", [0, wallet.address]),
        value: val,
        ...PARAMS
    });
    await tx.wait();
    log(`   [SUCCESS] Buy USDC.k CONFIRMED. Hash: ${tx.hash}`);
  }

  // Hardcode ABIs for simplicity in eval
  const dexAbi = ["function transfer(address to, uint256 val) returns (bool)", "function swapExactDNRForKTUSD(uint256 minOut, address to) payable"];
  const wrapAbi = ["function sell(uint256 amount18)"];
  
  // Real run
  try {
     await buyDNR(0.1, "Buy DNR with USDC.k");
     await buyDNR(0.2, "Sell USDC.k to grow DNR Price");
     await buyUSDC(0.01);
     log(`\n--- ALL TRADES SUCCESSFUL ---`);
  } catch (e) {
     log(`\n[CRITICAL ERROR] ${e.message}`);
  }
}

main();
