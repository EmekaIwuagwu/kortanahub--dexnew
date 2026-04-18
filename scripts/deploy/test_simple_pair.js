const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const wdnr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";
  const usdc = "0x28420E30857AE2340CA3127bB2539e3d0D767194";

  const PARAMS = { type: 0, gasPrice: 1, gasLimit: 5000000 };

  console.log(`\n🚀 [SENIOR ENGINEER] DEPLOYING SIMPLE PAIR...`);
  const Pair = await (await ethers.getContractFactory("SimplePair", wallet)).deploy(wdnr, usdc, PARAMS);
  await Pair.waitForDeployment();
  const pairAddress = await Pair.getAddress();
  console.log(`✅ SimplePair at: ${pairAddress}`);

  console.log(`Seeding Liquidity (1 DNR / 215 USDC)...`);
  const WDNR = await ethers.getContractAt("contracts/amm/KortanaAtomicRouter.sol:IWDNR", wdnr, wallet);
  const USDC = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdc, wallet);

  await (await WDNR.deposit({ value: ethers.parseEther("1"), ...PARAMS })).wait();
  await (await WDNR.transfer(pairAddress, ethers.parseEther("1"), PARAMS)).wait();
  await (await USDC.transfer(pairAddress, ethers.parseEther("215"), PARAMS)).wait();
  await (await Pair.sync(PARAMS)).wait();
  
  console.log(`✅ Seeded! Reserves: ${await Pair.reserve0()} / ${await Pair.reserve1()}`);

  console.log(`Testing SWAP (Buy 20 USDC)...`);
  const tx = await Pair.swap(0, ethers.parseEther("20"), wallet.address, PARAMS);
  console.log(`Swap Tx: ${tx.hash}`);
  const r = await tx.wait();
  console.log(`✅ SWAP STATUS: ${r.status === 1 ? 'SUCCESS' : 'FAILED'}`);
}

main().catch(console.error);
