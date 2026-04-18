// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DebugRouterV3 {
    address public constant PAIR = 0x85782446B5ac7c4BcCE639698042e3Ebf46d5242;

    function probe() public view returns (string memory) {
        (bool success, bytes memory data) = PAIR.staticcall(abi.encodeWithSignature("getReserves()"));
        if (!success) {
            return "STATICCALL_FAILED";
        }
        return "STATICCALL_SUCCESS";
    }

    function probeDetailed() public view returns (bool, bytes memory) {
        return PAIR.staticcall(abi.encodeWithSignature("getReserves()"));
    }
}
