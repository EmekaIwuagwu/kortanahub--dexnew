// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KortanaPair.sol";

contract KortanaFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    // Manual registration to bypass testnet deployment bug
    function registerPair(address tokenA, address tokenB, address pair) external {
        require(msg.sender == feeToSetter, "KORTANA: FORBIDDEN");
        require(tokenA != tokenB, "KORTANA: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "KORTANA: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "KORTANA: PAIR_EXISTS");

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    // Traditional createPair - may still fail on this testnet
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        revert("Use manual registerPair for this network");
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "KORTANA: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "KORTANA: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }

    function pairFor(address tokenA, address tokenB) public view returns (address) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return getPair[token0][token1];
    }
}
