// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract KortanaPair {
    address public factory;
    address public token0;
    address public token1;
    uint112 private reserve0;
    uint112 private reserve1;
    uint32  private blockTimestampLast;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Sync(uint112 reserve0, uint112 reserve1);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );

    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, 'Kortana: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    constructor() {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        require(msg.sender == factory, 'Kortana: FORBIDDEN');
        token0 = _token0;
        token1 = _token1;
    }

    // Direct Injection Genesis
    function genesisMint(address to, uint256 amount0, uint256 amount1) external {
        require(msg.sender == factory, 'Kortana: FORBIDDEN');
        require(totalSupply == 0, 'Kortana: ALREADY_SEEDED');
        
        reserve0 = uint112(amount0);
        reserve1 = uint112(amount1);
        
        uint256 liquidity = 1000 * 10**18; // Synthetic Genesis LP
        totalSupply = liquidity;
        balanceOf[to] = liquidity;
        
        emit Transfer(address(0), to, liquidity);
        emit Sync(reserve0, reserve1);
    }

    // [SOVEREIGN SWAP ENGINE]
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external lock {
        require(amount0Out > 0 || amount1Out > 0, 'Kortana: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, 'Kortana: INSUFFICIENT_LIQUIDITY');

        uint balance0;
        uint balance1;
        { // scope for _token{0,1}, avoids stack too deep
        address _token0 = token0;
        address _token1 = token1;
        require(to != _token0 && to != _token1, 'Kortana: INVALID_TO');
        if (amount0Out > 0) IERC20(_token0).transfer(to, amount0Out);
        if (amount1Out > 0) IERC20(_token1).transfer(to, amount1Out);
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));
        }
        uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, 'Kortana: INSUFFICIENT_INPUT_AMOUNT');
        { // scope for reserve{0,1}Adjusted, avoids stack too deep
        uint balance0Adjusted = balance0 * 1000 - (amount0In * 3);
        uint balance1Adjusted = balance1 * 1000 - (amount1In * 3);
        require(balance0Adjusted * balance1Adjusted >= uint(_reserve0) * uint(_reserve1) * (1000**2), 'Kortana: K');
        }

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function _update(uint balance0, uint balance1, uint112 _reserve0, uint112 _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, 'Kortana: OVERFLOW');
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    function sync() external lock {
        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)), reserve0, reserve1);
    }
}
