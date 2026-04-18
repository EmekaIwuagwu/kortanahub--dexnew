// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MinimalRouter {
    address public factory;
    constructor(address _factory) {
        factory = _factory;
    }
    function swap() external pure returns (uint) { return 1; }
}
