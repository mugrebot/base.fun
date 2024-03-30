// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DummyWETH
 * @dev A simplified version of WETH (Wrapped Ether) for testing purposes on local environments.
 * This contract mimics the behavior of WETH by allowing the deposit and withdrawal of Ether in exchange for WETH tokens.
 */

contract WETH is ERC20 {
	//event to log the received ether
	event Received(address, uint256);

	/**
	 * @dev Initializes the contract with a name and symbol for the ERC20 token.
	 */
	constructor() ERC20("Wrapped Ether", "WETH") {}

	/**
	 * @dev Deposits Ether and mints an equivalent amount of WETH tokens to the sender's address.
	 */
	function deposit() external payable {
		_mint(msg.sender, msg.value);
	}

	/**
	 * @dev Withdraws Ether by burning the specified amount of WETH tokens from the sender's address.
	 * @param amount The amount of WETH to burn in exchange for Ether.
	 */
	function withdraw(uint256 amount) external {
		_burn(msg.sender, amount);
		(bool success, ) = payable(msg.sender).call{ value: amount }("");
		require(success, "DummyWETH: Failed to send Ether");
	}
}
