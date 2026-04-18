// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NativeSovereignAnchor is ReentrancyGuard {
    address public immutable usdc;
    uint256 public reserveDNR;
    uint256 public reserveUSDC;

    event Swap(address indexed sender, uint256 dnrIn, uint256 usdcIn, uint256 dnrOut, uint256 usdcOut);
    event Sync(uint256 reserveDNR, uint256 reserveUSDC);

    constructor(address _usdc) {
        usdc = _usdc;
    }

    function sync() public {
        reserveDNR = address(this).balance;
        reserveUSDC = IERC20(usdc).balanceOf(address(this));
        emit Sync(reserveDNR, reserveUSDC);
    }

    // Sell USDC to Buy DNR (Grow DNR Price)
    function buyDNR(uint256 usdcAmountIn, uint256 minDnrOut, address to) external nonReentrant {
        require(usdcAmountIn > 0, "INSUFFICIENT_INPUT");
        
        // 1. Pull USDC
        IERC20(usdc).transferFrom(msg.sender, address(this), usdcAmountIn);
        
        // 2. Simple K math
        uint256 dnrOut = (usdcAmountIn * reserveDNR) / (reserveUSDC + usdcAmountIn);
        require(dnrOut >= minDnrOut, "SLIPPAGE");
        require(dnrOut < address(this).balance, "LIQUIDITY");

        // 3. Payout Native DNR
        payable(to).transfer(dnrOut);
        
        sync();
        emit Swap(msg.sender, 0, usdcAmountIn, dnrOut, 0);
    }

    // Buy USDC with DNR (Stability)
    function buyUSDC(uint256 minUsdcOut, address to) external payable nonReentrant {
        require(msg.value > 0, "INSUFFICIENT_INPUT");
        
        uint256 usdcOut = (msg.value * reserveUSDC) / (reserveDNR + msg.value);
        require(usdcOut >= minUsdcOut, "SLIPPAGE");

        IERC20(usdc).transfer(to, usdcOut);
        
        sync();
        emit Swap(msg.sender, msg.value, 0, 0, usdcOut);
    }

    receive() external payable {
        sync();
    }
}
