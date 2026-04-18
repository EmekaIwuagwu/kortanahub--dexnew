// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IKortanaPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
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

contract KortanaAtomicRouter {
    address public immutable WDNR;

    event SwapExecuted(address pair, uint amountIn, uint amountOut);

    constructor(address _WDNR) {
        WDNR = _WDNR;
    }

    receive() external payable {}

    // Atomic Swap: DNR -> Token
    function swapDNRForTokens(address pair, uint amountOutMin, address to, uint deadline) external payable {
        require(deadline >= block.timestamp, "Expired");
        uint amountIn = msg.value;
        
        // 1. Wrap DNR
        IWDNR(WDNR).deposit{value: amountIn}();
        
        // 2. Transfer to Pair
        IWDNR(WDNR).transfer(pair, amountIn);
        
        // 3. Execution
        (uint112 r0, uint112 r1, ) = IKortanaPair(pair).getReserves();
        address t0 = IKortanaPair(pair).token0();
        (uint reserveIn, uint reserveOut) = t0 == WDNR ? (uint(r0), uint(r1)) : (uint(r1), uint(r0));
        
        uint amountInWithFee = amountIn * 997;
        uint out = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
        require(out >= amountOutMin, "Slippage");

        (uint out0, uint out1) = t0 == WDNR ? (uint(0), out) : (out, uint(0));
        IKortanaPair(pair).swap(out0, out1, to, "");
        
        emit SwapExecuted(pair, amountIn, out);
    }

    // Atomic Swap: Token -> DNR
    function swapTokensForDNR(address pair, address tokenIn, uint amountIn, uint amountOutMin, address to, uint deadline) external {
        require(deadline >= block.timestamp, "Expired");
        
        // 1. Transfer to Pair
        require(IERC20(tokenIn).transferFrom(msg.sender, pair, amountIn), "Transfer failed");
        
        // 2. Execution
        (uint112 r0, uint112 r1, ) = IKortanaPair(pair).getReserves();
        address t0 = IKortanaPair(pair).token0();
        (uint reserveIn, uint reserveOut) = t0 == tokenIn ? (uint(r0), uint(r1)) : (uint(r1), uint(r0));
        
        uint amountInWithFee = amountIn * 997;
        uint out = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
        require(out >= amountOutMin, "Slippage");

        (uint out0, uint out1) = t0 == tokenIn ? (uint(0), out) : (out, uint(0));
        IKortanaPair(pair).swap(out0, out1, address(this), "");
        
        // 3. UnWrap and Send
        IWDNR(WDNR).withdraw(out);
        (bool success, ) = payable(to).call{value: out}("");
        require(success, "DNR Transfer failed");
        
        emit SwapExecuted(pair, amountIn, out);
    }
}
