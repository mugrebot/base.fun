// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Token.sol";

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";


contract TokenTest is Test {
    Token token;

    // Interfaces are declared at the contract level
    IUniswapV3Factory public uniswapV3Factory;
    INonfungiblePositionManager public positionManager;
    IWETH public weth;

    // Mock addresses
    address constant dummyWETH = address(0x4200000000000000000000000000000000000006);
    address constant uniswapV3FactoryAddress = address(0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24);
    address constant positionManagerAddress = address(0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2);
    address constant treasuryWallet = address(0x820AE05036E269BecbD3B01aA7e30bBc9f75026D);

    function setUp() public {
        // Cast the addresses to their respective interfaces
        uniswapV3Factory = IUniswapV3Factory(uniswapV3FactoryAddress);
        positionManager = INonfungiblePositionManager(positionManagerAddress);
        weth = IWETH(dummyWETH);

        // Deploy the token contract
        token = new Token(
            "FARTBEANS2",
            "BEANS2",
            payable(dummyWETH),
            uniswapV3FactoryAddress,
            positionManagerAddress,
            treasuryWallet
        );
    }

    function testTokenInitialization() public {
        // Testing basic properties
        assertEq(token.name(), "Test Token");
        assertEq(token.symbol(), "TTN");
        assertEq(address(token.weth()), dummyWETH);
        assertEq(address(token.uniswapV3Factory()), uniswapV3FactoryAddress);
        assertEq(address(token.positionManager()), positionManagerAddress);
        assertEq(token.treasuryWallet(), treasuryWallet);
    }
}
