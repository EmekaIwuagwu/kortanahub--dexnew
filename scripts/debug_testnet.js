/**
 * Debug script: test individual operations with detailed error info
 */
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS = { gasPrice: 10000000000n, type: 0 };

async function main() {
    const [deployer] = await ethers.getSigners();
    const configPath = path.join(__dirname, "../config/kortanaTestnet.json");
    const C = JSON.parse(fs.readFileSync(configPath, "utf8")).contracts;

    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DNR\n");

    const WDNR = await ethers.getContractAt("WDNR", C.WDNR);
    const Kortusd = await ethers.getContractAt("KORTUSD", C.kortusd);
    const Pair = await ethers.getContractAt("KortanaPair", C.pair);
    const LiqMgr = await ethers.getContractAt("KortanaLiquidityManager", C.liquidityManager);

    // Step 1: Check pair state
    console.log("=== PAIR STATE ===");
    const token0 = await Pair.token0();
    const token1 = await Pair.token1();
    console.log("  token0:", token0);
    console.log("  token1:", token1);
    console.log("  WDNR:", C.WDNR);
    console.log("  KORTUSD:", C.kortusd);
    const [r0, r1, ts] = await Pair.getReserves();
    console.log("  reserve0:", ethers.formatEther(r0));
    console.log("  reserve1:", ethers.formatEther(r1));
    console.log("  totalSupply:", ethers.formatEther(await Pair.totalSupply()));
    console.log("  factory:", await Pair.factory());

    // Step 2: Check KORTUSD balance
    const kBal = await Kortusd.balanceOf(deployer.address);
    console.log("\n=== BALANCES ===");
    console.log("  KORTUSD:", ethers.formatEther(kBal));
    const wBal = await WDNR.balanceOf(deployer.address);
    console.log("  WDNR:", ethers.formatEther(wBal));

    // Step 3: Check LiqMgr config
    console.log("\n=== LIQUIDITY MANAGER ===");
    console.log("  factory:", await LiqMgr.factory());
    console.log("  WDNR:", await LiqMgr.WDNR());

    // Step 4: Try a minimal liquidity add with various gas limits
    console.log("\n=== TESTING LIQUIDITY ADD ===");
    
    // First ensure we have KORTUSD
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const hasMinter = await Kortusd.hasRole(MINTER_ROLE, deployer.address);
    console.log("  Has MINTER_ROLE:", hasMinter);

    if (kBal < ethers.parseEther("100")) {
        console.log("  Minting 1000 KORTUSD...");
        try {
            const tx = await Kortusd.mint(deployer.address, ethers.parseEther("1000"), { gasLimit: 200000, ...GAS });
            await tx.wait();
            console.log("  Mint OK");
        } catch(e) {
            console.log("  Mint failed:", e.shortMessage || e.message.split("\n")[0]);
        }
    }

    // Approve
    console.log("  Approving LiqMgr for KORTUSD...");
    try {
        const tx = await Kortusd.approve(C.liquidityManager, ethers.MaxUint256, { gasLimit: 100000, ...GAS });
        await tx.wait();
        console.log("  Approve OK");
    } catch(e) {
        console.log("  Approve failed:", e.shortMessage || e.message.split("\n")[0]);
    }

    // Try addLiquidity with different gas limits
    const dnr = ethers.parseEther("5");
    const kusd = ethers.parseEther("100");
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    for (const gasLimit of [300000, 500000, 1000000, 2000000, 3000000]) {
        console.log("  Trying addLiquidityDNR with gasLimit=" + gasLimit + "...");
        try {
            const tx = await LiqMgr.addLiquidityDNR(
                C.kortusd, kusd, 0, 0, deployer.address, deadline,
                { value: dnr, gasLimit: gasLimit, ...GAS }
            );
            const receipt = await tx.wait();
            console.log("  SUCCESS! gasUsed=" + receipt.gasUsed.toString());
            // Check reserves after
            const [rr0, rr1] = await Pair.getReserves();
            console.log("  New reserves:", ethers.formatEther(rr0), ethers.formatEther(rr1));
            break;
        } catch(e) {
            const msg = e.shortMessage || e.message.split("\n")[0];
            // Check if the receipt shows gas used
            if (e.receipt) {
                console.log("  FAILED (gasUsed=" + e.receipt.gasUsed.toString() + "): " + msg);
            } else {
                console.log("  FAILED: " + msg);
            }
        }
    }
}

main().catch(console.error);
