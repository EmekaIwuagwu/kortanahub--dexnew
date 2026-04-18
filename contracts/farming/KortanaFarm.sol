// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title KortanaFarm
 * @notice Stake LP tokens to earn KORTUSD rewards.
 *         Simple single-pool farm for DNR/KORTUSD LP holders.
 *
 * Reward mechanism:
 *   - Owner deposits reward tokens (KORTUSD) into the farm
 *   - Rewards distributed per block proportional to share of total staked LP
 *   - Users can stake, unstake, and claim at any time
 */
contract KortanaFarm is Ownable, ReentrancyGuard {
    IERC20 public immutable lpToken;       // LP token to stake (KortanaPair)
    IERC20 public immutable rewardToken;   // Reward token (KORTUSD)

    uint256 public rewardPerBlock;         // Reward tokens per block
    uint256 public lastRewardBlock;        // Last block rewards were calculated
    uint256 public accRewardPerShare;      // Accumulated rewards per share (scaled 1e18)
    uint256 public totalStaked;            // Total LP tokens staked

    struct UserInfo {
        uint256 amount;       // LP tokens staked
        uint256 rewardDebt;   // Reward debt for proper accounting
    }

    mapping(address => UserInfo) public userInfo;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor(
        address _lpToken,
        address _rewardToken,
        uint256 _rewardPerBlock
    ) Ownable() {
        lpToken = IERC20(_lpToken);
        rewardToken = IERC20(_rewardToken);
        rewardPerBlock = _rewardPerBlock;
        lastRewardBlock = block.number;
    }

    /// @notice Update reward variables to be up-to-date
    function updatePool() public {
        if (block.number <= lastRewardBlock) return;
        if (totalStaked == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 blocks = block.number - lastRewardBlock;
        uint256 reward = blocks * rewardPerBlock;
        accRewardPerShare += (reward * 1e18) / totalStaked;
        lastRewardBlock = block.number;
    }

    /// @notice Stake LP tokens to earn rewards
    function deposit(uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();

        // Claim pending rewards first
        if (user.amount > 0) {
            uint256 pending = (user.amount * accRewardPerShare / 1e18) - user.rewardDebt;
            if (pending > 0) {
                _safeRewardTransfer(msg.sender, pending);
                emit Claim(msg.sender, pending);
            }
        }

        if (amount > 0) {
            lpToken.transferFrom(msg.sender, address(this), amount);
            user.amount += amount;
            totalStaked += amount;
        }

        user.rewardDebt = user.amount * accRewardPerShare / 1e18;
        emit Deposit(msg.sender, amount);
    }

    /// @notice Withdraw LP tokens and claim rewards
    function withdraw(uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= amount, "FARM: INSUFFICIENT_BALANCE");
        updatePool();

        uint256 pending = (user.amount * accRewardPerShare / 1e18) - user.rewardDebt;
        if (pending > 0) {
            _safeRewardTransfer(msg.sender, pending);
            emit Claim(msg.sender, pending);
        }

        if (amount > 0) {
            user.amount -= amount;
            totalStaked -= amount;
            lpToken.transfer(msg.sender, amount);
        }

        user.rewardDebt = user.amount * accRewardPerShare / 1e18;
        emit Withdraw(msg.sender, amount);
    }

    /// @notice View pending rewards for a user
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 _accRewardPerShare = accRewardPerShare;
        if (block.number > lastRewardBlock && totalStaked > 0) {
            uint256 blocks = block.number - lastRewardBlock;
            uint256 reward = blocks * rewardPerBlock;
            _accRewardPerShare += (reward * 1e18) / totalStaked;
        }
        return (user.amount * _accRewardPerShare / 1e18) - user.rewardDebt;
    }

    /// @notice Safe transfer: won't transfer more than the farm balance
    function _safeRewardTransfer(address to, uint256 amount) internal {
        uint256 bal = rewardToken.balanceOf(address(this));
        if (amount > bal) amount = bal;
        if (amount > 0) rewardToken.transfer(to, amount);
    }

    // ─── ADMIN ───────────────────────────────────────────────────────────────
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        updatePool();
        rewardPerBlock = _rewardPerBlock;
        emit RewardRateUpdated(_rewardPerBlock);
    }
}
