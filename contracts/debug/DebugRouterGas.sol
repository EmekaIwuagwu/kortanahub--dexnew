// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DebugRouterGas {
    address public constant PAIR = 0x85782446B5ac7c4BcCE639698042e3Ebf46d5242;

    function probe(uint32 gasLim) public view returns (bool, bytes memory) {
        return PAIR.staticcall{gas: gasLim}(abi.encodeWithSignature("getReserves()"));
    }
}
