const fs = require("fs");
const path = require("path");

const contracts = [
    "artifacts/contracts/stablecoin/KortanaOracle.sol/KortanaOracle.json",
    "artifacts/contracts/stablecoin/KortanaStabilizer.sol/KortanaStabilizer.json",
    "artifacts/contracts/bridge/KortanaBridgeSource.sol/KortanaBridgeSource.json",
    "artifacts/contracts/farming/KortanaFarm.sol/KortanaFarm.json",
    "artifacts/contracts/stablecoin/KORTUSD.sol/KORTUSD.json",
    "artifacts/contracts/amm/KortanaPair.sol/KortanaPair.json",
];

for (const p of contracts) {
    try {
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        const bytes = (j.bytecode.length - 2) / 2;
        console.log(`${path.basename(p, ".json").padEnd(25)} : ${bytes} bytes (${(bytes/1024).toFixed(1)} KB)`);
    } catch (e) {
        console.log(`${path.basename(p, ".json").padEnd(25)} : NOT FOUND`);
    }
}
