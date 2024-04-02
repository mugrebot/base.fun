// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicToken2 is ERC20, Ownable {
    constructor() ERC20("BasicToken", "BTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1 million tokens to deployer
        _mint(address(this), 1000000 * 10**18); // Mint 1 million tokens to contract
    }
}
