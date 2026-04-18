// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./KORTUSD.sol";
import "./KortanaOracle.sol";

/**
 * @title KortanaStabilizer
 * @notice Hybrid stablecoin system:
 *   - Partially collateralized (DNR or whitelisted tokens)
 *   - Algorithmic supply adjustment
 *   - Stability fee on minting
 *   - Circuit breaker on depeg > 5%
 *
 * INTENTIONALLY AVOIDS UST/LUNA failure pattern:
 *   - Requires REAL collateral (not just native token)
 *   - Collateral ratio cannot drop below MIN_COLLATERAL_RATIO
 *   - Burns are always enabled (exit always works)
 */
contract KortanaStabilizer is Ownable, ReentrancyGuard {
    KORTUSD public immutable kortusd;
    KortanaOracle public oracle;

    // Collateral token (e.g., WDNR or USDC bridged)
    address public collateralToken;

    // Ratios in basis points (10000 = 100%)
    uint256 public collateralRatio = 8000;      // 80% collateral-backed (start safe)
    uint256 public constant MIN_COLLATERAL_RATIO = 5000; // Never below 50%
    uint256 public constant MAX_COLLATERAL_RATIO = 10000; // 100% = fully collateral

    uint256 public stabilityFee = 50;           // 0.5% mint fee
    uint256 public constant MAX_STABILITY_FEE = 500; // Cap at 5%
    uint256 public constant DEPEG_THRESHOLD = 500;   // 5% = trigger circuit breaker

    uint256 public totalCollateral;             // Total collateral locked
    uint256 public mintedSupply;                // KORTUSD minted via this contract

    address public treasury;

    event Minted(address indexed user, uint256 collateralIn, uint256 kortusdOut, uint256 fee);
    event Burned(address indexed user, uint256 kortusdIn, uint256 collateralOut);
    event CollateralRatioUpdated(uint256 oldRatio, uint256 newRatio);
    event PegCheckFailed(uint256 currentPrice, uint256 pegTarget);

    constructor(
        address _kortusd,
        address _oracle,
        address _collateralToken,
        address _treasury
    ) Ownable() {
        kortusd = KORTUSD(_kortusd);
        oracle = KortanaOracle(_oracle);
        collateralToken = _collateralToken;
        treasury = _treasury;
    }

    /**
     * @notice Mint KORTUSD by depositing collateral
     * @param collateralAmount Amount of collateral token to deposit
     * @param minKortusdOut Minimum KORTUSD to receive (slippage protection)
     */
    function mint(uint256 collateralAmount, uint256 minKortusdOut)
        external nonReentrant
    {
        // Peg check before minting
        _checkPegAndMaybeCircuitBreak();

        uint256 collateralPrice = oracle.getCollateralPrice(); // price in USD, 18 decimals
        // Amount of KORTUSD = collateral USD value / collateralRatio
        uint256 kortusdToMint = (collateralAmount * collateralPrice * 10000)
            / (1e18 * collateralRatio);

        // Stability fee
        uint256 fee = (kortusdToMint * stabilityFee) / 10000;
        uint256 kortusdOut = kortusdToMint - fee;

        require(kortusdOut >= minKortusdOut, "STABILIZER: SLIPPAGE_TOO_HIGH");

        // Transfer collateral in
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        totalCollateral += collateralAmount;
        mintedSupply += kortusdOut;

        // Mint KORTUSD to user, fee to treasury
        kortusd.mint(msg.sender, kortusdOut);
        if (fee > 0) kortusd.mint(treasury, fee);

        emit Minted(msg.sender, collateralAmount, kortusdOut, fee);
    }

    /**
     * @notice Burn KORTUSD to redeem collateral
     * @param kortusdAmount Amount of KORTUSD to burn
     * @param minCollateralOut Minimum collateral to receive
     */
    function burn(uint256 kortusdAmount, uint256 minCollateralOut)
        external nonReentrant
    {
        // Burns ALWAYS work — even during depeg (exit liquidity guaranteed)
        uint256 collateralPrice = oracle.getCollateralPrice();
        uint256 collateralOut = (kortusdAmount * collateralRatio * 1e18)
            / (collateralPrice * 10000);

        require(collateralOut >= minCollateralOut, "STABILIZER: SLIPPAGE_TOO_HIGH");
        require(collateralOut <= totalCollateral, "STABILIZER: INSUFFICIENT_COLLATERAL");

        // Burn KORTUSD from user
        kortusd.burnFrom(msg.sender, kortusdAmount);
        totalCollateral -= collateralOut;
        mintedSupply = mintedSupply > kortusdAmount ? mintedSupply - kortusdAmount : 0;

        // Return collateral
        IERC20(collateralToken).transfer(msg.sender, collateralOut);
        emit Burned(msg.sender, kortusdAmount, collateralOut);
    }

    /**
     * @notice Check current KORTUSD peg price.
     *         If deviation > DEPEG_THRESHOLD, trigger circuit breaker.
     */
    function _checkPegAndMaybeCircuitBreak() internal {
        uint256 currentPrice = oracle.getKORTUSDPrice(); // Should be ~1e18 (1 USD)
        uint256 pegTarget = 1e18;
        uint256 deviation;

        if (currentPrice < pegTarget) {
            deviation = ((pegTarget - currentPrice) * 10000) / pegTarget;
        } else {
            deviation = ((currentPrice - pegTarget) * 10000) / pegTarget;
        }

        if (deviation > DEPEG_THRESHOLD) {
            kortusd.triggerCircuitBreaker("DEPEG_THRESHOLD_EXCEEDED");
            emit PegCheckFailed(currentPrice, pegTarget);
            revert("STABILIZER: CIRCUIT_BREAKER_TRIGGERED");
        }
    }

    // ─── GOVERNANCE ──────────────────────────────────────────────────────────

    function setCollateralRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= MIN_COLLATERAL_RATIO && newRatio <= MAX_COLLATERAL_RATIO,
            "STABILIZER: RATIO_OUT_OF_BOUNDS");
        emit CollateralRatioUpdated(collateralRatio, newRatio);
        collateralRatio = newRatio;
    }

    function setStabilityFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_STABILITY_FEE, "STABILIZER: FEE_TOO_HIGH");
        stabilityFee = newFee;
    }

    function setOracle(address newOracle) external onlyOwner {
        oracle = KortanaOracle(newOracle);
    }

    function collateralizationRate() external view returns (uint256) {
        if (mintedSupply == 0) return 10000;
        uint256 collateralUSD = (totalCollateral * oracle.getCollateralPrice()) / 1e18;
        return (collateralUSD * 10000) / mintedSupply;
    }
}
