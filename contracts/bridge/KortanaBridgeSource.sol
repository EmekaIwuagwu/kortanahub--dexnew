// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title KortanaBridgeSource
 * @notice Lock tokens on Kortana chain → Relayer mints on destination (BSC).
 *
 * SECURITY MODEL:
 * - Relayer is a trusted off-chain service that watches LockEvent
 * - For production, replace with a decentralized validator set or LayerZero
 */
contract KortanaBridgeSource is Ownable, ReentrancyGuard, Pausable {
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => bool) public processedTxIds;
    mapping(address => bool) public relayers;

    uint256 public nonce;
    uint256 public bridgeFee = 0.001 ether; // DNR fee per bridge tx

    event TokensLocked(
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 destChainId,
        address destAddress,
        uint256 nonce,
        bytes32 txId
    );

    event TokensReleased(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 sourceTxId
    );

    modifier onlyRelayer() {
        require(relayers[msg.sender], "BRIDGE: NOT_RELAYER");
        _;
    }

    constructor() Ownable() {}

    /**
     * @notice Lock tokens on Kortana to bridge to another chain
     */
    function lockTokens(
        address token,
        uint256 amount,
        uint256 destChainId,
        address destAddress
    ) external payable nonReentrant whenNotPaused {
        require(supportedTokens[token], "BRIDGE: TOKEN_NOT_SUPPORTED");
        require(amount > 0, "BRIDGE: ZERO_AMOUNT");
        require(msg.value >= bridgeFee, "BRIDGE: INSUFFICIENT_FEE");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        bytes32 txId = keccak256(abi.encodePacked(
            block.chainid, destChainId, msg.sender, destAddress, token, amount, nonce
        ));

        emit TokensLocked(token, msg.sender, amount, destChainId, destAddress, nonce, txId);
        nonce++;
    }

    /**
     * @notice Release tokens (called by relayer when burn confirmed on dest chain)
     */
    function releaseTokens(
        address token,
        address recipient,
        uint256 amount,
        bytes32 sourceTxId
    ) external onlyRelayer nonReentrant {
        require(!processedTxIds[sourceTxId], "BRIDGE: TX_ALREADY_PROCESSED");
        require(IERC20(token).balanceOf(address(this)) >= amount, "BRIDGE: INSUFFICIENT_RESERVES");

        processedTxIds[sourceTxId] = true;
        IERC20(token).transfer(recipient, amount);

        emit TokensReleased(token, recipient, amount, sourceTxId);
    }

    // ─── ADMIN ───────────────────────────────────────────────────────────────
    function addSupportedToken(address token) external onlyOwner { supportedTokens[token] = true; }
    function removeSupportedToken(address token) external onlyOwner { supportedTokens[token] = false; }
    function addRelayer(address relayer) external onlyOwner { relayers[relayer] = true; }
    function removeRelayer(address relayer) external onlyOwner { relayers[relayer] = false; }
    function setBridgeFee(uint256 fee) external onlyOwner { bridgeFee = fee; }
    function withdrawFees() external onlyOwner { payable(owner()).transfer(address(this).balance); }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
