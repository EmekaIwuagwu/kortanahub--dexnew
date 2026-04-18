// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Sovereign USDC.k (Institutional Edition)
 * @notice High-speed, un-frozen stablecoin for KortanaDEX ecosystem.
 */
contract SovereignUSDC is ERC20, Ownable {
    constructor() ERC20("Bridged USDC", "USDC.k") {
        // Initial mint for liquidity seeding (matching the 215k depth)
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
