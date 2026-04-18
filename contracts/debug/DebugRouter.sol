// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IKortanaPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
}

contract DebugRouter {
    address public constant PAIR = 0x85782446B5ac7c4BcCE639698042e3Ebf46d5242;
    address public constant WDNR = 0x259F3561FE751157458Cfbd3A6eB149c321C45A5;

    function getQuote(uint256 amountIn) public view returns (uint256 amountOut) {
        (uint112 r0, uint112 r1, ) = IKortanaPair(PAIR).getReserves();
        address t0 = IKortanaPair(PAIR).token0();
        (uint256 reserveIn, uint256 reserveOut) = t0 == WDNR ? (uint256(r0), uint256(r1)) : (uint256(r1), uint256(r0));
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }
}
