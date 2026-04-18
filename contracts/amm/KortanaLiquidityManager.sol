// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/KortanaLibrary.sol";
import "../interfaces/IKortanaFactory.sol";
import "../interfaces/IKortanaPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWDNR {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
}

contract KortanaLiquidityManager {
    address public immutable factory;
    address public immutable WDNR;

    constructor(address _factory, address _WDNR) {
        factory = _factory;
        WDNR = _WDNR;
    }

    receive() external payable {}

    function addLiquidityDNR(
        address token, uint amountTokenDesired, uint amountTokenMin, uint amountDNRMin, address to, uint deadline
    ) external payable returns (uint amountToken, uint amountDNR, uint liquidity) {
        require(deadline >= block.timestamp, "E");
        
        // Ensure pair exists or create it
        address pair = IKortanaFactory(factory).getPair(token, WDNR);
        if (pair == address(0)) {
            pair = IKortanaFactory(factory).createPair(token, WDNR);
        }

        (uint rT, uint rD) = KortanaLibrary.getReserves(factory, token, WDNR);
        if (rT == 0) {
            (amountToken, amountDNR) = (amountTokenDesired, msg.value);
        } else {
            uint dOpt = (amountTokenDesired * rD) / rT;
            if (dOpt <= msg.value) {
                require(dOpt >= amountDNRMin, "L");
                (amountToken, amountDNR) = (amountTokenDesired, dOpt);
            } else {
                uint tOpt = (msg.value * rT) / rD;
                require(tOpt >= amountTokenMin, "T");
                (amountToken, amountDNR) = (tOpt, msg.value);
            }
        }
        
        IERC20(token).transferFrom(msg.sender, pair, amountToken);
        IWDNR(WDNR).deposit{value: amountDNR}();
        assert(IWDNR(WDNR).transfer(pair, amountDNR));
        liquidity = IKortanaPair(pair).mint(to);
        
        if (msg.value > amountDNR) {
            (bool success,) = msg.sender.call{value: msg.value - amountDNR}("");
            require(success, "R");
        }
    }
}
