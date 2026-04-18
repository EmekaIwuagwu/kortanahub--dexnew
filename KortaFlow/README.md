# 🤖 KortaFlow — Market Maker Bot
### Built for the Kortana Blockchain | DNR / USDC.k Trading Pair

**KortaFlow** is an automated Market Maker Bot designed to generate consistent, legitimate, and organic-looking trade volume on the Kortana DEX.

---

## 🚀 Quick Start

### 1. Installation
```bash
cd KortaFlow
npm install
```

### 2. Configuration
Copy the `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
**Required Fields:**
*   `KORTANA_RPC_URL`: Your mainnet RPC (Verified: `https://zeus-rpc.mainnet.kortana.xyz`)
*   `DEX_ROUTER_ADDRESS`: The whitelisted DEX Router or Sovereign Mirror.
*   `WALLET_1` ... `WALLET_5`: Private keys for your funded trading wallets.

### 3. Pre-Flight Check
Ensure all wallets are funded with both **Native DNR** (for gas) and the **DNR/USDC.k tokens** for swapping.
```bash
npm run check-balances
```

### 4. Start Trading (Local)
```bash
npm start
```

### 5. Cloud Deployment (Render)
KortaFlow is ready for Render.com as a **Background Worker**:
1.  Push this folder to a Private GitHub/GitLab repository.
2.  Connect the repo to Render.
3.  Use the included `render.yaml` Blueprint or the `Dockerfile`.
4.  Add your `.env` variables to the Render Dashboard.

---

## 🏗️ Features

*   **Wallet Rotation**: Randomly selects from your wallet pool to simulate multiple users.
*   **Organic Randomization**: Randomized trade sizes and timing intervals to mimic human behavior.
*   **Safety Guards**: Automatically pauses if gas is too high or if wallet balances drop below minimums.
*   **Transparent Logging**: Every trade is logged in `logs/trades.json` with direct explorer links.
*   **Genesis-Hardened**: Pre-configured for Kortana's specific gas and EVM requirements (Type-0 / London).

---

## 🔐 Security

*   Never share your `.env` file or commit it to version control.
*   Use dedicated wallets for trading, never your main treasury account.
*   Keep your RPC endpoint private to prevent rate-limiting.

---

*KortaFlow v1.0.0 — Real volume. Real swaps. Real market activity.*
