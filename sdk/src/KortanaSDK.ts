import { ethers } from "ethers";
import { swapExactTokensForTokens } from "./swap";

export class KortanaSDK {
    provider: ethers.Provider;
    signer?: ethers.Signer;
    routerAddress: string;

    constructor(providerUrl: string, routerAddress: string, privateKey?: string) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.routerAddress = routerAddress;
        if (privateKey) {
            this.signer = new ethers.Wallet(privateKey, this.provider);
        }
    }

    async swapTokens(amountIn: bigint, amountOutMin: bigint, path: string[], to: string, deadline: number) {
        if (!this.signer) throw new Error("Signer required for transactions");
        return swapExactTokensForTokens(this.signer, this.routerAddress, amountIn, amountOutMin, path, to, deadline);
    }
    
    // Additional wrappers for liquidity, bridge, and KORTUSD goes here
}
