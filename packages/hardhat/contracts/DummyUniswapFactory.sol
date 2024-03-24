// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract DummyUniswapFactory {
	mapping(address => mapping(address => address)) public getPair;
	address[] public allPairs;

	event PairCreated(
		address indexed token0,
		address indexed token1,
		address pair,
		uint
	);

	function createPair(
		address tokenA,
		address tokenB
	) external returns (address pair) {
		require(tokenA != tokenB, "DummyFactory: IDENTICAL_ADDRESSES");
		require(
			tokenA != address(0) && tokenB != address(0),
			"DummyFactory: ZERO_ADDRESS"
		);
		require(
			getPair[tokenA][tokenB] == address(0),
			"DummyFactory: PAIR_EXISTS"
		);

		// Mocking the pair address generation. In practice, this would be a deployed contract.
		pair = address(
			uint160(
				uint(
					keccak256(abi.encodePacked(tokenA, tokenB, allPairs.length))
				)
			)
		);

		getPair[tokenA][tokenB] = pair;
		getPair[tokenB][tokenA] = pair; // Enable bidirectional lookup
		allPairs.push(pair);

		emit PairCreated(tokenA, tokenB, pair, allPairs.length);
	}
}
