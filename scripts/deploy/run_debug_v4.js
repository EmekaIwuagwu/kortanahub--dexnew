const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const RouterFactory = await ethers.getContractFactory('DebugRouterV4', wallet);
  const Router = await RouterFactory.deploy({ type: 0, gasPrice: ethers.parseUnits('3', 'gwei'), gasLimit: 8000000 });
  await Router.waitForDeployment();
  console.log('Router deployed at:', Router.target);

  try {
    const t0 = await Router.probeToken0();
    console.log('SUCCESS! Token0:', t0);
  } catch (e) {
    console.error('FAILED! Reason:', e.message);
  }
}

main().catch(console.error);
