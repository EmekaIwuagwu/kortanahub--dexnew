// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract KORTUSD is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Depeg circuit breaker
    uint256 public constant DEPEG_THRESHOLD = 500; // 5% in basis points
    bool public mintingPaused;

    event MintingPaused(string reason);
    event MintingResumed();

    constructor(address admin) ERC20("Kortana USD", "KORTUSD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!mintingPaused, "KORTUSD: MINTING_CIRCUIT_BREAKER_ACTIVE");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    // Emergency circuit breaker — pauses all new minting if peg deviates
    function triggerCircuitBreaker(string calldata reason) external onlyRole(PAUSER_ROLE) {
        mintingPaused = true;
        emit MintingPaused(reason);
    }

    function resumeMinting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingPaused = false;
        emit MintingResumed();
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
