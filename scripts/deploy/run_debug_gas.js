const { ethers } = require("hardhat");

async function main() {
  const masterPK = '0xe5aab94508f057a4608f971c8ad37d01e5888c66acc941cef70479ad08b8ec70';
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const wallet = new ethers.Wallet(masterPK, provider);

  const RouterFactory = await ethers.getContractFactory('DebugRouterGas', wallet);
  const Router = await RouterFactory.deploy({ type: 0, gasPrice: ethers.parseUnits('3', 'gwei'), gasLimit: 8000000 });
  await Router.waitForDeployment();
  console.log('Router deployed at:', Router.target);

  const gasLimits = [10000, 50000, 100000, 500000];
  for (const lim of gasLimits) {
      try {
          const [success, data] = await Router.probe(lim);
          console.log(`Gas limit ${lim}: Success=${success}, DataLen=${data.length}`);
          if (success) {
              console.log(`  Data: ${data}`);
          }
      } catch (e) {
          console.error(`Gas limit ${lim} call failed:`, e.message);
      }
  }
}

main().catch(console.error);
