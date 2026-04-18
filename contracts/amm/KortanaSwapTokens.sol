// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/KortanaLibrary.sol";
import "../interfaces/IKortanaPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWDNR {
    function withdraw(uint256) external;
}

contract KortanaSwapTokens {
    address public immutable factory;
    address public immutable WDNR;

    constructor(address _factory, address _WDNR) {
        factory = _factory;
        WDNR = _WDNR;
    }

    receive() external payable {}

    function swapExactTokensForDNR(uint amountIn, uint amountOutMin, address[] memory path, address to, uint deadline)
        external returns (uint[] memory amounts)
    {
        require(deadline >= block.timestamp, "E");
        amounts = KortanaLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "O");
        IERC20(path[0]).transferFrom(msg.sender, KortanaLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWDNR(WDNR).withdraw(amounts[amounts.length - 1]);
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "F");
    }

    function _swap(uint[] memory amounts, address[] memory path, address _to) internal {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = KortanaLibrary.sortTokens(input, output);
            uint out = amounts[i + 1];
            (uint a0, uint a1) = input == token0 ? (uint(0), out) : (out, uint(0));
            address to = i < path.length - 2 ? KortanaLibrary.pairFor(factory, output, path[i + 2]) : _to;
            IKortanaPair(KortanaLibrary.pairFor(factory, input, output)).swap(a0, a1, to, new bytes(0));
        }
    }
}
