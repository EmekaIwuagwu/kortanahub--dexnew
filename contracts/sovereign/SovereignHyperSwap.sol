// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SovereignHyperSwap {
    address public immutable udnr;
    address public immutable usdc;
    uint256 public rate = 382; // 1 USDC = 382 uDNR

    constructor(address _udnr, address _usdc) {
        udnr = _udnr;
        usdc = _usdc;
    }

    // Direct Exchange: Buy DNR with USDC.k
    function buyDNR(uint256 amountUSDC) external {
        IERC20(usdc).transferFrom(msg.sender, address(this), amountUSDC);
        uint256 amountDNR = amountUSDC * rate;
        IERC20(udnr).transfer(msg.sender, amountDNR);
    }

    // Direct Exchange: Buy USDC with DNR
    function buyUSDC(uint256 amountDNR) external {
        IERC20(udnr).transferFrom(msg.sender, address(this), amountDNR);
        uint256 amountUSDC = amountDNR / rate;
        IERC20(usdc).transfer(msg.sender, amountUSDC);
    }
}
