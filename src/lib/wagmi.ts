import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

console.log("🏛️ INITIALIZING ZEUS MAINNET CONFIG (ID: 9002 + LEGACY ALIAS: 7251)");

// OFFICIAL KORTANA ZEUS MAINNET DEFINITION
export const kortanaMainnet = {
  id: 9002,
  name: 'Kortana Zeus Mainnet',
  nativeCurrency: { name: 'Dinar', symbol: 'DNR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://zeus-rpc.mainnet.kortana.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Kortana Scan', url: 'https://zeus-explorer.mainnet.kortana.xyz' },
  },
};

// LEGACY ALIAS FOR KORTANA WALLET COMPATIBILITY
export const kortanaLegacy = {
  ...kortanaMainnet,
  id: 7251,
  name: 'Kortana Legacy (Mainnet)',
};

export const config = createConfig({
  chains: [kortanaMainnet, kortanaLegacy],
  connectors: [injected()],
  transports: {
    [9002]: http('https://zeus-rpc.mainnet.kortana.xyz'),
    [7251]: http('https://zeus-rpc.mainnet.kortana.xyz'), // FORCE TESTNET ID TO USE MAINNET RPC
  },
});