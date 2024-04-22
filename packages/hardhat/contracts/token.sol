// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../node_modules/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "../node_modules/@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";


interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}
interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );

}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}


contract Token is ERC20, Ownable, IERC721Receiver {
	using SafeERC20 for IERC20;
	uint256 public liquidityProvisionThreshold = 10 ether;
	bool public isLiquidityProvisionLocked = false;
	IUniswapV3Factory public uniswapV3Factory;
    INonfungiblePositionManager public positionManager;
    // Define constants for pool parameters,
    int24 private constant MIN_TICK = -887272;
    int24 private constant MAX_TICK = -MIN_TICK;
    int24 private constant TICK_SPACING = 200;
    uint24 private constant POOL_FEE = 10000; // Pool fee in hundredths of a bip, i.e., 3000 represents 0.3%
	//create a variable to store the weth contract address
	IWETH public weth;
	address public treasuryWallet;
	error InsufficientETHSent();
	error ExceedsThreshold();
	error UnauthorizedAccess();
	error LiquidityProvisionLocked();
    error NotEnoughMinted();

	constructor(
		string memory name_,
		string memory symbol_,
		address payable _dummyWETH,
        address _uniswapV3Factory,
        address _positionManager,
        address _treasuryWallet
	) ERC20(name_, symbol_) Ownable(msg.sender) {
        
        uniswapV3Factory = IUniswapV3Factory(_uniswapV3Factory);
        positionManager = INonfungiblePositionManager(_positionManager);
        weth = IWETH(_dummyWETH);
        createAndInitializePoolIfNecessary(address(weth), address(this), POOL_FEE);
        address pool = uniswapV3Factory.getPool(address(weth), address(this), POOL_FEE);
        treasuryWallet = _treasuryWallet;
        _mint(0x000000000000000000000000000000000000dEaD, 1e18);
	}
	modifier whenNotLocked() {
		if (isLiquidityProvisionLocked) revert LiquidityProvisionLocked();
		_;
	}
    //function to get pool address given, tokenA, tokenB and fee
    function getPoolAddress(address tokenA, address tokenB, uint24 fee) public view returns (address) {
        return uniswapV3Factory.getPool(tokenA, tokenB, fee);
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
//function to create uniswap pool and add lp
        function createAndInitializePoolIfNecessary(
        address tokenA,
        address tokenB,
        uint24 fee // Initial sqrt price
    ) public {
        uint160 sqrtPriceX96 = 1 << 96;
        address pool = uniswapV3Factory.getPool(tokenA, tokenB, fee);
        if (pool == address(0)) {
            uniswapV3Factory.createPool(tokenA, tokenB, fee);
            pool = uniswapV3Factory.getPool(tokenA, tokenB, fee);
            IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        }
    }
    function mintNewPosition(uint256 amount0ToAdd, uint256 amount1ToAdd, address _token)
        external payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        IERC20(address(this)).approve(address(positionManager), amount0ToAdd);
        IERC20(address(weth)).approve(address(positionManager), amount1ToAdd);
        INonfungiblePositionManager.MintParams memory params =
        INonfungiblePositionManager.MintParams({
            token0: address(weth),
            token1: address(this),
            fee: POOL_FEE,
            tickLower: (MIN_TICK / TICK_SPACING) * TICK_SPACING,
            tickUpper: (MAX_TICK / TICK_SPACING) * TICK_SPACING,
            amount0Desired: amount0ToAdd,
            amount1Desired: amount1ToAdd,
            amount0Min: 0,
            amount1Min: 0,
            recipient: 0x000000000000000000000000000000000000dEaD,
            deadline: block.timestamp
        });
        (tokenId, liquidity, amount0, amount1) = positionManager.mint(params);
    }
function mint(uint256 amount) public payable whenNotLocked {
    //needs to mint atleast >= 1 token
    if (amount < 1) revert NotEnoughMinted();
    uint256 mintCost = calculateMintCost(totalSupply(), amount);
    if (msg.value <= mintCost) revert InsufficientETHSent();
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
    if (isLiquidityProvisionLocked = false && address(this).balance >= liquidityProvisionThreshold) {
        isLiquidityProvisionLocked = true;
        // Wrap the ETH to WETH
        _wrapETH();
        // Add liquidity to the pool
        this.mintNewPosition(IERC20(address(weth)).balanceOf(address(this)), IERC20(address(weth)).balanceOf(address(this)), address(weth));
    }

    emit TokenMinted(msg.sender, amount);

}

    function burn(uint256 amount) public whenNotLocked {
        uint256 burnProceeds = calculateBurnProceeds(amount);
        if (burnProceeds > address(this).balance) revert InsufficientETHSent();

        _burn(msg.sender, amount);
        payable(msg.sender).transfer(burnProceeds);

            emit TokenBurned(msg.sender, amount);
        }
    
        function calculateMintCost(uint256 currentSupply, uint256 mintAmount) public view returns (uint256) {
            if (currentSupply == 0) {
            return ((_sumOfPriceToNTokens(currentSupply + mintAmount)));
            }
            else {
                return ((_sumOfPriceToNTokens(currentSupply + mintAmount)) - (_sumOfPriceToNTokens(currentSupply)));
            }
        }
    
        function calculateBurnProceeds(uint256 amount) public view returns (uint256) {
            uint256 currentSupply = totalSupply();
            if (amount >= currentSupply) revert ExceedsThreshold();
    
            return _sumOfPriceToNTokens(currentSupply) - _sumOfPriceToNTokens(currentSupply - amount);
        }

    
        // The price of all tokens from number 1 to n.
        // This function was previously used in your bonding curve example,
        // Ensure to replace or adjust it to fit your actual use case.
        function _sumOfPriceToNTokens(uint256 n) internal pure returns (uint256) {
            return (n / 1e18)*((n/1e18) + 1) * (2 * (n/1e18) + 1) / 6;
        }


        function _wrapETH() public payable {
            //check if liquidity locked is true
            if (!isLiquidityProvisionLocked) revert LiquidityProvisionLocked();

            address payable wethAddressPayable = payable(address(weth));
            // Ensure the conversion was successful and the address is not the zero address
            //deposit 5% of the eth to a treasury wallet, 1% to the owner of the contract
            uint256 treasuryAmount = address(this).balance * 5 / 100;
            payable(treasuryWallet).transfer(treasuryAmount);
            uint256 ownerAmount = address(this).balance * 1 / 100;
            payable(owner()).transfer(ownerAmount);
            // Send the ETH to the WETH contract
            (bool success, ) = wethAddressPayable.call{value: address(this).balance}("");
            if (!success) revert InsufficientETHSent();
            }

        event TokenMinted(address indexed to, uint256 amount);
        event TokenBurned(address indexed from, uint256 amount);
        event LiquidityAdded(uint256 ethAmount, uint256 tokenAmount, address _pool);
    }
    