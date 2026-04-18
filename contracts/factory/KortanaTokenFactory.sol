// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KortanaStandardToken.sol";

contract KortanaTokenFactory {
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply
    );

    address[] public allTokens;
    mapping(address => address[]) public tokensByCreator;

    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply
    ) external returns (address tokenAddress) {
        KortanaStandardToken newToken = new KortanaStandardToken(
            name,
            symbol,
            decimals,
            totalSupply,
            msg.sender
        );
        
        tokenAddress = address(newToken);
        allTokens.push(tokenAddress);
        tokensByCreator[msg.sender].push(tokenAddress);

        emit TokenCreated(tokenAddress, msg.sender, name, symbol, totalSupply);
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }
    
    function totalTokens() external view returns (uint256) {
        return allTokens.length;
    }
}
