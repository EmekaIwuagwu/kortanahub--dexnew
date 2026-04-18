// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// RE-MANIFESTED INTERFACES (SOVEREIGN STABILITY)
interface IKortanaPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

interface IKortanaFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IWDNR {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
    function withdraw(uint256) external;
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract KortanaSwapDNR {
    address public immutable factory;
    address public immutable WDNR;

    event LogStep(string step, uint256 val);

    constructor(address _factory, address _WDNR) {
        factory = _factory;
        WDNR = _WDNR;
    }

    receive() external payable {}

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        if (amountIn == 0) return 0;
        if (reserveIn == 0 || reserveOut == 0) return 0;
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, 'Kortana: INVALID_PATH');
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            address pair = IKortanaFactory(factory).getPair(path[i], path[i + 1]);
            require(pair != address(0), "Kortana: NO_PAIR");
            (uint112 reserve0, uint112 reserve1,) = IKortanaPair(pair).getReserves();
            (uint256 reserveIn, uint256 reserveOut) = path[i] == IKortanaPair(pair).token0() ? (reserve0, reserve1) : (reserve1, reserve0);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function swapExactDNRForTokens(uint amountOutMin, address[] memory path, address to, uint deadline)
        external payable returns (uint[] memory amounts)
    {
        require(deadline >= block.timestamp, "Expired");
        emit LogStep("DNR_SWAP_START", msg.value);
        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Output too low");
        
        IWDNR(WDNR).deposit{value: amounts[0]}();
        emit LogStep("DEPOSITED_WDNR", amounts[0]);
        
        address pair = IKortanaFactory(factory).getPair(path[0], path[1]);
        IWDNR(WDNR).transfer(pair, amounts[0]);
        emit LogStep("TRANSFERRED_TO_PAIR", amounts[0]);
        
        _executeSwap(amounts, path, to);
        emit LogStep("SWAP_COMPLETE", amounts[amounts.length-1]);
    }

    function swapExactTokensForDNR(uint amountIn, uint amountOutMin, address[] memory path, address to, uint deadline)
        external returns (uint[] memory amounts)
    {
        require(deadline >= block.timestamp, "Expired");
        emit LogStep("TOKEN_SWAP_START", amountIn);
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Output too low");

        address pair = IKortanaFactory(factory).getPair(path[0], path[1]);
        require(IERC20(path[0]).transferFrom(msg.sender, pair, amounts[0]), "Kortana: TRANSFER_FAILED");
        emit LogStep("TRANSFERRED_FROM_BOT", amounts[0]);
        
        _executeSwap(amounts, path, address(this));
        emit LogStep("XYK_EXECUTION_COMPLETE", amounts[amounts.length - 1]);
        
        uint dnrOut = amounts[amounts.length - 1];
        IWDNR(WDNR).withdraw(dnrOut);
        emit LogStep("WDNR_WITHDRAWN", dnrOut);
        
        (bool success, ) = payable(to).call{value: dnrOut}("");
        require(success, "Kortana: ETH_TRANSFER_FAILED");
        emit LogStep("DNR_SENT_TO_BOT", dnrOut);
    }

    function _executeSwap(uint[] memory amounts, address[] memory path, address _to) internal {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            address pairAddr = IKortanaFactory(factory).getPair(input, output);
            address token0 = IKortanaPair(pairAddr).token0();
            uint out = amounts[i + 1];
            (uint a0, uint a1) = input == token0 ? (uint(0), out) : (out, uint(0));
            address nextTo = i < path.length - 2 ? IKortanaFactory(factory).getPair(output, path[i + 2]) : _to;
            IKortanaPair(pairAddr).swap(a0, a1, nextTo, new bytes(0));
        }
    }
}
