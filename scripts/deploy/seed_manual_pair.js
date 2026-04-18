const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const pairAddress = "0x4251Bfe762EB0535a22C4653b4353f184A13eb4d";
  const usdcAddr = "0x28420E30857AE2340CA3127bB2539e3d0D767194";
  const wdnrAddr = "0x259F3561FE751157458Cfbd3A6eB149c321C45A5";

  const Pair = await ethers.getContractAt("KortanaPair", pairAddress, wallet);
  const WDNR = await ethers.getContractAt("contracts/amm/KortanaAtomicRouter.sol:IWDNR", wdnrAddr, wallet);
  const USDC = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcAddr, wallet);

  console.log(`\n🚀 [SENIOR ENGINEER] SEEDING FRESH PAIR LIQUIDITY...`);

  const dnrAmount = ethers.parseEther("10"); // 10 DNR
  const usdcAmount = ethers.parseEther("2159"); // ~2159 USDC

  const PARAMS = { type: 0, gasPrice: ethers.parseUnits("3", "gwei"), gasLimit: 5000000 };

  console.log(`1. Wrapping DNR...`);
  await (await WDNR.deposit({ value: dnrAmount, ...PARAMS })).wait();
  
  console.log(`2. Transferring WDNR to Pair...`);
  await (await WDNR.transfer(pairAddress, dnrAmount, PARAMS)).wait();
  
  console.log(`3. Transferring USDC.k to Pair...`);
  await (await USDC.transfer(pairAddress, usdcAmount, PARAMS)).wait();
  
  console.log(`4. Executing Genesis Mint...`);
  const tx = await Pair.genesisMint(wallet.address, dnrAmount, usdcAmount, PARAMS);
  await tx.wait();
  
  console.log(`✅ Liquidity Seeded Successfully!`);
  const res = await Pair.getReserves();
  console.log(`Reserves: ${ethers.formatUnits(res[0], 18)} / ${ethers.formatUnits(res[1], 18)}`);
}

main().catch(console.error);
