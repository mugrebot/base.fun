// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract DummyUniswapRouter {
	address public immutable WETH;
	address public immutable factory;

	constructor(address _weth, address _factory) {
		WETH = _weth;
		factory = _factory;
	}

	function addLiquidityETH(
		address token,
		uint256 amountTokenDesired,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		address to,
		uint256 deadline
	)
		external
		payable
		returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
	{
		// This function would interact with the Factory to create a liquidity pool or add to it
		// For simplicity, assume liquidity is always successfully added
		return (amountTokenDesired, msg.value, 0); // Mock return values
	}

	function swapExactTokensForETHSupportingFeeOnTransferTokens(
		uint256 amountIn,
		uint256 amountOutMin,
		address[] calldata path,
		address to,
		uint256 deadline
	) external {
		// Simulate a token swap from token to ETH, ignoring fees and actual swap logic
	}

	function swapExactETHForTokensSupportingFeeOnTransferTokens(
		uint256 amountOutMin,
		address[] calldata path,
		address to,
		uint256 deadline
	) external payable {
		// Simulate a swap from ETH to token, ignoring fees and actual swap logic
	}

	// Additional UniswapV2Router functions can be mocked similarly based on your testing requirements.
}
