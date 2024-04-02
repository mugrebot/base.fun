// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../node_modules/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "../node_modules/@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../node_modules/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";


// Including ERC721 Receiver to handle NFTs (positions) returned by Uniswap
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract UniswapV3PoolDeployer is IERC721Receiver {
    using SafeERC20 for IERC20;

    IUniswapV3Factory public immutable uniswapV3Factory;
    INonfungiblePositionManager public immutable positionManager;
    ISwapRouter public immutable swapRouter;
    
    // Define constants for pool parameters, these could be different based on your use case
    int24 private constant MIN_TICK = -887272;
    int24 private constant MAX_TICK = -MIN_TICK;
    int24 private constant TICK_SPACING = 200;
    uint24 private constant POOL_FEE = 10000; // Pool fee in hundredths of a bip, i.e., 3000 represents 0.3%

    constructor(
        address _uniswapV3Factory,
        address _positionManager,
        address _swapRouter
    ) {
        uniswapV3Factory = IUniswapV3Factory(_uniswapV3Factory);
        positionManager = INonfungiblePositionManager(_positionManager);
        swapRouter = ISwapRouter(_swapRouter);
    }

    // Allows the contract to receive ERC721 tokens, necessary for Uniswap V3 NFTs
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Combine minting and adding liquidity into one function
    function mintAndAddLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external returns  (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) {
        // Ensure the pool is created and initialized
        createAndInitializePoolIfNecessary(tokenA, tokenB, POOL_FEE);

        //approve this contract to spend the tokens?
        IERC20(tokenA).approve(address(this), amountA);
        IERC20(tokenB).approve(address(this), amountB);

        // Transfer tokens to this contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        // Approve the position manager to use the tokens for minting
        IERC20(tokenA).approve(address(positionManager), amountA);
        IERC20(tokenB).approve(address(positionManager), amountB);

        // Mint a new position in the pool
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: tokenA,
            token1: tokenB,
            fee: POOL_FEE,
            tickLower: (MIN_TICK/TICK_SPACING)*TICK_SPACING,
            tickUpper: (MAX_TICK/TICK_SPACING)*TICK_SPACING,
            amount0Desired: amountA,
            amount1Desired: amountB,
            amount0Min: 0, // Slippage protection
            amount1Min: 0, // Slippage protection
            recipient: msg.sender,
            deadline: block.timestamp
        });

        // Mint the position and get the tokenId
        (tokenId, liquidity, amount0, amount1) = positionManager.mint(params);
 

        // Refund any unused tokens
        refundUnusedTokens(tokenA, msg.sender, amountA);
        refundUnusedTokens(tokenB, msg.sender, amountB);
    }

    // Refunds unused ERC20 tokens to the user
    function refundUnusedTokens(address token, address recipient, uint256 amount) private {
        uint256 contractBalance = IERC20(token).balanceOf(address(this));
        if (contractBalance < amount) {
            IERC20(token).transfer(recipient, contractBalance);
        }
    }

    // Creates and initializes a Uniswap V3 pool if it does not exist
    function createAndInitializePoolIfNecessary(
        address tokenA,
        address tokenB,
        uint24 fee // Initial sqrt price
    ) private {
        uint160 sqrtPriceX96 = 1 << 96;
        address pool = uniswapV3Factory.getPool(tokenA, tokenB, fee);
        if (pool == address(0)) {
            uniswapV3Factory.createPool(tokenA, tokenB, fee);
            pool = uniswapV3Factory.getPool(tokenA, tokenB, fee);
            IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        }
    }

    // Collect fees from a Uniswap V3 position
    function collectFees(uint256 tokenId) external {
        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: msg.sender,
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });
        positionManager.collect(params);
    }

    // ... Other functions such as increasing/decreasing liquidity, etc.
}
