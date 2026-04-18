// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IKortanaFactory.sol";
import "../interfaces/IKortanaPair.sol";
import "../libraries/KortanaLibrary.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWDNR {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address to, uint256 value) external returns (bool);
}

contract KortanaRouter {
    address public immutable factory;
    address public immutable WDNR;

    constructor(address _factory, address _WDNR) {
        factory = _factory;
        WDNR = _WDNR;
    }

    receive() external payable {
        assert(msg.sender == WDNR);
    }

    function _swap(uint[] memory amounts, address[] memory path, address _to) internal {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = KortanaLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? KortanaLibrary.pairFor(factory, output, path[i + 2]) : _to;
            IKortanaPair(KortanaLibrary.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }

    function swapExactDNRForTokens(uint amountOutMin, address[] memory path, address to, uint deadline)
        external payable returns (uint[] memory amounts)
    {
        require(deadline >= block.timestamp, "KORTANA: EXPIRED");
        require(path[0] == WDNR, "KORTANA: INVALID_PATH");
        amounts = KortanaLibrary.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "KORTANA: INSUFFICIENT_OUTPUT_AMOUNT");
        IWDNR(WDNR).deposit{value: amounts[0]}();
        assert(IWDNR(WDNR).transfer(KortanaLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }

    function swapExactTokensForDNR(uint amountIn, uint amountOutMin, address[] memory path, address to, uint deadline)
        external returns (uint[] memory amounts)
    {
        require(deadline >= block.timestamp, "KORTANA: EXPIRED");
        require(path[path.length - 1] == WDNR, "KORTANA: INVALID_PATH");
        amounts = KortanaLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "KORTANA: INSUFFICIENT_OUTPUT_AMOUNT");
        IERC20(path[0]).transferFrom(msg.sender, KortanaLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWDNR(WDNR).withdraw(amounts[amounts.length - 1]);
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "KORTANA: ETH_TRANSFER_FAILED");
    }

    function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts) {
        return KortanaLibrary.getAmountsOut(factory, amountIn, path);
    }
}

