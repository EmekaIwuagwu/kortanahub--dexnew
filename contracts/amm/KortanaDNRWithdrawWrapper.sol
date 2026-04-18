// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMonoDEX {
    function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract KortanaDNRWithdrawWrapper {
    address public constant DEX = 0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45;

    function sell(uint256 amount18) external {
        // Step 1: Pull ktUSD from caller into this wrapper
        // Requires bot to have called dex.approve(address(this), amount) first.
        IMonoDEX(DEX).swapExactKTUSDForDNR(amount18, 0, address(this));

        // Step 2: Forward all received DNR to caller
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }

    receive() external payable {}
}
