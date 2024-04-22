// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicToken is ERC20, Ownable {
    constructor(address _contract) ERC20("BasicToken", "BTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1 million tokens to deployer
        _mint(address(this), 1000000 * 10**18); // Mint 1 million tokens to contract
        _mint(_contract, 1000000 * 10**18); // Mint 1 million tokens to contract
    }
}
