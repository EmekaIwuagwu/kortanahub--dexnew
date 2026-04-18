const { ethers } = require("hardhat");

async function main() {
  const masterPK = "0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70";
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  console.log(`\n--- 🏛️ KORTANADEX GENESIS CORRECTION ($215.92) ---`);
  
  const LEGACY_PARAMS = {
    type: 0,
    gasPrice: ethers.parseUnits("3", "gwei"),
    gasLimit: 8000000
  };

  // NEW ADDRESSES (We deploy a clean pair to fix the reserves)
  const USDCk = await ethers.getContractFactory("KORTUSD", wallet);
  const usdck = await USDCk.deploy(wallet.address, { ...LEGACY_PARAMS });
  await usdck.waitForDeployment();
  const usdckAddr = await usdck.getAddress();

  const WDNR = await ethers.getContractFactory("WDNR", wallet);
  const wdnr = await WDNR.deploy({ ...LEGACY_PARAMS });
  await wdnr.waitForDeployment();
  const wdnrAddr = await wdnr.getAddress();

  const Factory = await ethers.getContractFactory("KortanaFactory", wallet);
  const factory = await Factory.deploy(wallet.address, { ...LEGACY_PARAMS });
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();

  const Pair = await ethers.getContractFactory("KortanaPair", wallet);
  const pairContract = await Pair.deploy({ ...LEGACY_PARAMS });
  await pairContract.waitForDeployment();
  const pairAddr = await pairContract.getAddress();

  // Correct token sorting
  const [t0, t1] = wdnrAddr < usdckAddr ? [wdnrAddr, usdckAddr] : [usdckAddr, wdnrAddr];
  await (await pairContract.initialize(t0, t1, { ...LEGACY_PARAMS })).wait();
  await (await factory.registerPair(wdnrAddr, usdckAddr, pairAddr, { ...LEGACY_PARAMS })).wait();
  
  const dnrAmount = ethers.parseUnits("1000", 18);
  const usdcAmount = ethers.parseUnits("215920", 18);

  // Mint and Transfer
  await (await usdck.mint(wallet.address, usdcAmount, { ...LEGACY_PARAMS })).wait();
  await (await usdck.transfer(pairAddr, usdcAmount, { ...LEGACY_PARAMS })).wait();
  
  const wdnrContract = await ethers.getContractAt(["function deposit() payable", "function transfer(address, uint256) returns (bool)"], wdnrAddr, wallet);
  await (await wdnrContract.deposit({ value: dnrAmount, ...LEGACY_PARAMS })).wait();
  await (await wdnrContract.transfer(pairAddr, dnrAmount, { ...LEGACY_PARAMS })).wait();

  // THE KEY: Ensure amounts match token sorting
  // if wdnr is t0, amount0 is dnrAmount. 
  const [a0, a1] = wdnrAddr < usdckAddr ? [dnrAmount, usdcAmount] : [usdcAmount, dnrAmount];
  
  console.log(`- Finalizing Correction: t0=${t0}, a0=${ethers.formatUnits(a0, 18)}`);
  await (await pairContract.genesisMint(wallet.address, a0, a1, { ...LEGACY_PARAMS })).wait();

  console.log(`\n💎 CORRECTION COMPLETE. 1 DNR = $215.92`);
  console.log(`NEW FACTORY: ${factoryAddr}`);
  console.log(`NEW USDC.k:  ${usdckAddr}`);
  console.log(`NEW WDNR:    ${wdnrAddr}`);
  console.log(`NEW PAIR:    ${pairAddr}`);
}

main().catch(console.error);
