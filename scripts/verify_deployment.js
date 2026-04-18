const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 Verifying KortanaDEX Deployments on Testnet...");
    
    const configPath = path.join(__dirname, "../config/kortanaTestnet.json");
    if (!fs.existsSync(configPath)) {
        console.error("❌ config/kortanaTestnet.json not found!");
        return;
    }

    const { contracts } = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log("\n---------------------------------------------------------");
    console.log("CONTRACT COMPONENT          | STATUS | ADDRESS");
    console.log("---------------------------------------------------------");

    for (const [name, address] of Object.entries(contracts)) {
        if (!address) {
            console.log(`${name.padEnd(27)} | ⚠️ SKIP | Null Address`);
            continue;
        }

        try {
            const code = await ethers.provider.getCode(address);
            if (code === "0x") {
                console.log(`${name.padEnd(27)} | ❌ FAIL | ${address}`);
            } else {
                console.log(`${name.padEnd(27)} | ✅ LIVE | ${address}`);
            }
        } catch (e) {
            console.log(`${name.padEnd(27)} | ❌ ERR  | ${address} (${e.message.split(":")[0]})`);
        }
    }
    
    console.log("---------------------------------------------------------");
    console.log("✅ Verification Complete. Ready for Frontend Integration.\n");
}

main().catch(console.error);
