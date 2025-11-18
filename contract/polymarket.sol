 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockPolymarket {
    event BetPlaced(address indexed user, string market, string side, uint256 amount);

    function placeBet(string calldata market, string calldata side) external payable {
        require(msg.value > 0, "No ETH sent");
        emit BetPlaced(msg.sender, market, side, msg.value);
    }
}
