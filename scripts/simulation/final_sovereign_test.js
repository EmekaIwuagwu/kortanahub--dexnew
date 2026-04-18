const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const UDNR = "0xE4a96A5e9615BC803F15A44B7aB956AA450E446B";
  const SUSDC = "0x32E3610bcc0DfD81E5246b8f6740bcCf0F82F709";
  const DEX = "0x8E3E74df2154AfF858CBDCD211c91850B58C4D82";
  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 5000000, chainId: 9002 };

  const logFile = "trading_k_log.txt";
  function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
  }

  fs.writeFileSync(logFile, `--- KORTANA SOVEREIGN TRADING LOG ---\nTimestamp: ${new Date().toISOString()}\n\n`);

  const dexIface = new ethers.Interface([
    "function swap(uint256, uint256, address)",
    "function getReserves() view returns (uint256, uint256)",
    "function sync()",
    "function deposit() payable",
    "function transfer(address, uint256) returns (bool)"
  ]);
  const tokenIface = new ethers.Interface(["function transfer(address, uint256) returns (bool)"]);

  async function executeSwap(amountIn, tokenInAddr, label) {
    log(`[SCENARIO] ${label}`);
    
    // 1. Send input tokens to DEX
    log(`   [1] Transferring input to DEX...`);
    const txT = await wallet.sendTransaction({
        to: tokenInAddr,
        data: tokenIface.encodeFunctionData("transfer", [DEX, amountIn]),
        ...PARAMS
    });
    await txT.wait();

    // 2. Calculate output based on constant product
    const dex = new ethers.Contract(DEX, dexIface, provider);
    const [r0, r1] = await dex.getReserves();
    const isToken0 = tokenInAddr.toLowerCase() === UDNR.toLowerCase();
    
    let amountOut;
    if (isToken0) {
        // Swap DNR for USDC (token0 -> token1)
        // reserve0 * reserve1 = (reserve0 + amountIn) * (reserve1 - amountOut)
        amountOut = r1 - (r0 * r1) / (r0 + amountIn);
        log(`   [2] Swapping DNR for USDC.k...`);
        const txS = await wallet.sendTransaction({
            to: DEX,
            data: dexIface.encodeFunctionData("swap", [0, amountOut - 1000n, wallet.address]),
            ...PARAMS
        });
        const rS = await txS.wait();
        log(`   ✅ SUCCESS: ${txS.hash} | Block: ${rS.blockNumber}`);
    } else {
        // Swap USDC for DNR (token1 -> token0)
        amountOut = r0 - (r0 * r1) / (r1 + amountIn);
        log(`   [2] Swapping USDC.k for DNR (Price Growth)...`);
        const txS = await wallet.sendTransaction({
            to: DEX,
            data: dexIface.encodeFunctionData("swap", [amountOut - 1000n, 0, wallet.address]),
            ...PARAMS
        });
        const rS = await txS.wait();
        log(`   ✅ SUCCESS: ${txS.hash} | Block: ${rS.blockNumber}`);
    }
  }

  async function seed() {
    log(`[0] Seeding Unrestricted Liquidity...`);
    // Seed 0.1 DNR and 22 USDC.k
    const dnrVal = ethers.parseEther("0.1");
    const usdcVal = ethers.parseEther("22.0");
    
    // Deposit DNR
    await (await wallet.sendTransaction({ to: UDNR, data: dexIface.encodeFunctionData('deposit'), value: dnrVal, ...PARAMS })).wait();
    // Move both to DEX
    await (await wallet.sendTransaction({ to: UDNR, data: tokenIface.encodeFunctionData('transfer', [DEX, dnrVal]), ...PARAMS })).wait();
    await (await wallet.sendTransaction({ to: SUSDC, data: tokenIface.encodeFunctionData('transfer', [DEX, usdcVal]), ...PARAMS })).wait();
    // Sync
    await (await wallet.sendTransaction({ to: DEX, data: dexIface.encodeFunctionData('sync'), ...PARAMS })).wait();
    log(`   ✅ Seeding Complete.`);
  }

  try {
     await seed();
     const testValDNR = ethers.parseEther("0.001");
     const testValUSDC = ethers.parseEther("0.2");

     await executeSwap(testValUSDC, SUSDC, "Buy DNR with USDC.k");
     await executeSwap(testValUSDC, SUSDC, "Sell USDC.k to get DNR (Price Growth)");
     await executeSwap(testValDNR, UDNR, "Buy USDC.k with DNR");

     log(`\n--- ALL VERIFICATIONS 100% SUCCESSFUL ---`);
  } catch (e) {
     log(`\n[CRITICAL ERROR] ${e.message}`);
  }
}

main();
