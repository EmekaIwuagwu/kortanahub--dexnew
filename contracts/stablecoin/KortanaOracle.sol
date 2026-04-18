// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KortanaOracle
 * @notice Lightweight manual price oracle for Kortana DEX.
 *         Owner sets collateral and KORTUSD prices.
 *         Designed to fit within testnet deployment gas limits.
 */
contract KortanaOracle {
    address public owner;
    address public immutable pair;

    uint256 public manualCollateralPrice;
    uint256 public manualKORTUSDPrice;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address _pair) {
        owner = msg.sender;
        pair = _pair;
    }

    function getCollateralPrice() external view returns (uint256) {
        return manualCollateralPrice;
    }

    function getKORTUSDPrice() external view returns (uint256) {
        return manualKORTUSDPrice;
    }

    function setManualPrices(uint256 collateralPrice, uint256 kortusdPrice) external onlyOwner {
        manualCollateralPrice = collateralPrice;
        manualKORTUSDPrice = kortusdPrice;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
