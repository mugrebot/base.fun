// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../node_modules/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "../node_modules/@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../node_modules/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./interfaces/WETH.sol";





interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

interface IUniswapV3PoolDeployer {
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
        );
    function createAndInitializePoolIfNecessary(
        address tokenA,
        address tokenB,
        uint24 fee // Initial sqrt price
    ) external;
    function collectFees(uint256 tokenId) external;
}


contract Token is ERC20, Ownable, ReentrancyGuard, IERC721Receiver {
	using SafeERC20 for IERC20;

	uint256 public liquidityProvisionThreshold = 0.5 * 1e18; // Adjust as per your requirement
	bool public isLiquidityProvisionLocked = false;


	IUniswapV3Factory public immutable uniswapV3Factory;
    ISwapRouter public immutable swapRouter;
    INonfungiblePositionManager public immutable positionManager;
    IUniswapV3PoolDeployer public immutable unideployer;

    // Define constants for pool parameters,
    int24 private constant MIN_TICK = -887272;
    int24 private constant MAX_TICK = -MIN_TICK;
    int24 private constant TICK_SPACING = 200;
    uint24 private constant POOL_FEE = 10000; // Pool fee in hundredths of a bip, i.e., 3000 represents 0.3%

	//create a variable to store the weth contract address
	IWETH public weth;
	address public treasuryWallet;

	error InsufficientETHSent();
	error MintingExceedsThreshold();
	error ZeroAddressUsed();
	error UnauthorizedAccess();
	error LiquidityProvisionLocked();

	constructor(
		string memory name_,
		string memory symbol_,
		address payable _dummyWETH,
        address _uniswapV3Factory,
        address _positionManager,
        address _swapRouter,
        address _unideployer
	) ERC20(name_, symbol_) Ownable(msg.sender) {

        uniswapV3Factory = IUniswapV3Factory(_uniswapV3Factory);
        positionManager = INonfungiblePositionManager(_positionManager);
        swapRouter = ISwapRouter(_swapRouter);
        weth = IWETH(_dummyWETH);
        unideployer = IUniswapV3PoolDeployer(_unideployer);

        createAndInitializePoolIfNecessary(address(this), address(weth), POOL_FEE);
	}

	modifier whenNotLocked() {
		if (isLiquidityProvisionLocked) revert LiquidityProvisionLocked();
		_;
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

    //approve external contract to spend this contract's tokens in both tokenA and tokenB
    function approveContract() external onlyOwner {
        IERC20(address(this)).approve(address(unideployer), 10000000000000000000e18);

        IERC20(address(weth)).approve(address(unideployer), 1000000000000e18);

    }

//function to create uniswap pool and add lp
function sendIT() public {
    unideployer.mintAndAddLiquidity(address(this), address(weth), 1e18, 0.001e18);
}

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

function mint(uint256 amount) public payable whenNotLocked {
    // Start of non-reentrant section
    isLiquidityProvisionLocked = true;

    uint256 mintCost = calculateMintCost(totalSupply(), amount);
    require(msg.value >= mintCost, "Insufficient ETH sent");

 //this is to supply liquidity to the pool 
 //fee will be 15% of the mint amount
    uint256 fee = amount * 15 / 100;
    _mint(address(this), fee);

    uint256 remainder = amount - fee;

    _mint(msg.sender, remainder);
    if (msg.value > mintCost) {
        payable(msg.sender).transfer(msg.value - mintCost);

    }

    // If threshold is reached and not locked, provide liquidity
    if (address(this).balance > liquidityProvisionThreshold) {
        sendIT();
    }

    emit TokenMinted(msg.sender, amount);

    // End of non-reentrant section
    isLiquidityProvisionLocked = false;
}

    function burn(uint256 amount) public nonReentrant whenNotLocked {
        uint256 burnProceeds = calculateBurnProceeds(amount);
        if (burnProceeds > address(this).balance) revert InsufficientETHSent();

        _burn(msg.sender, amount);
        payable(msg.sender).transfer(burnProceeds);

            emit TokenBurned(msg.sender, amount);
        }
    
        function calculateMintCost(uint256 currentSupply, uint256 mintAmount) public pure returns (uint256) {
            return ((_sumOfPriceToNTokens(currentSupply + mintAmount) - _sumOfPriceToNTokens(currentSupply)));
        }
    
        function calculateBurnProceeds(uint256 amount) public view returns (uint256) {
            uint256 currentSupply = totalSupply();
            require(amount <= currentSupply, "Burn amount exceeds current supply");
    
            return _sumOfPriceToNTokens(currentSupply) - _sumOfPriceToNTokens(currentSupply - amount);
        }
    
        function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
            if (_treasuryWallet == address(0)) revert ZeroAddressUsed();
            treasuryWallet = _treasuryWallet;
        }
    
        // The price of all tokens from number 1 to n.
        // This function was previously used in your bonding curve example,
        // Ensure to replace or adjust it to fit your actual use case.
        function _sumOfPriceToNTokens(uint256 n) internal pure returns (uint256) {
            return (n / 1e18)*((n/1e18) + 1) * (2 * (n/1e18) + 1) / 6;
        }

		//write a function to create a uniswap pair 


		//write a function to add liquidity to the uniswap pair
		//NEED TO WRAP THE ETH IN WETH CONTRACT, YOU CAN SEND THE ETH TO THE WETH CONTRACT ADDRESS AND ITLL RETURN WETH TO YOU

function _wrapETH() public payable {
    // Cast the IWETH interface to an address, then to address payable
    address payable wethAddressPayable = payable(address(weth));
    
    // Ensure the conversion was successful and the address is not the zero address
    require(wethAddressPayable != address(0), "Invalid WETH address");

    // Send the ETH to the WETH contract
    (bool success, ) = wethAddressPayable.call{value: address(this).balance}("");
    require(success, "ETH to WETH conversion failed");
}

    function collectFees(uint256 tokenId) external {
        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: msg.sender,
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });
        positionManager.collect(params);
    }


    
        // Additional utility functions or modifications can be added here
    
        event TokenMinted(address indexed to, uint256 amount);
        event TokenBurned(address indexed from, uint256 amount);
        event LiquidityAdded(uint256 ethAmount, uint256 tokenAmount, uint256 liquidity);
    }
    