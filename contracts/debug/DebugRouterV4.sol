// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DebugRouterV4 {
    address public constant PAIR = 0x85782446B5ac7c4BcCE639698042e3Ebf46d5242;

    function probeToken0() public view returns (address) {
        (bool success, bytes memory data) = PAIR.staticcall(abi.encodeWithSignature("token0()"));
        require(success, "TOKEN0_FAILED");
        return abi.decode(data, (address));
    }
}
