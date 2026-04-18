const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://zeus-rpc.mainnet.kortana.xyz");
  const addr = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
  
  const code = await provider.getCode(addr);
  console.log(`Code Length: ${code.length}`);
  
  const iface = new ethers.Interface([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function getReserves() view returns (uint256, uint256)"
  ]);
  
  const contract = new ethers.Contract(addr, iface, provider);
  
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`Name: ${name}, Symbol: ${symbol}`);
    
    const [r0, r1] = await contract.getReserves();
    console.log(`Reserve 0: ${ethers.formatEther(r0)}, Reserve 1: ${ethers.formatEther(r1)}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

main();
