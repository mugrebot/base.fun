// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapV3Pool.sol";
import "./interfaces/WETH.sol";


contract Token is ERC20, Ownable, ReentrancyGuard {
	using SafeERC20 for IERC20;

	uint256 public liquidityProvisionThreshold = 5 * 1e18; // Adjust as per your requirement
	bool public isLiquidityProvisionLocked = false;
  	uint24 public feeTier;

	IUniswapV3Factory public uniswapV3Factory;
	IUniswapV3Pool public uniswapV3Pool;
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
		address _uniswapV3FactoryAddress,
		address payable _dummyWETH,
		uint24 _feeTier // 100 = 1% | 3000 = .3% | 5000 = .05% | 10000 = .01%
	) ERC20(name_, symbol_) Ownable(msg.sender) {
      if (_uniswapV3FactoryAddress == address(0)) revert ZeroAddressUsed();

        uniswapV3Factory = IUniswapV3Factory(_uniswapV3FactoryAddress);
        weth = IWETH(_dummyWETH);

        // note: maybe set the fee tier here
        feeTier = _feeTier;

        // Create and initialize the pool if it doesn't exist
        createAndInitializePoolIfNecessary(
            address(this),
            _dummyWETH,
            feeTier,
            1 << 96 // This sets the initial price to 1. Adjust according to your strategy.
        );
	}

	modifier whenNotLocked() {
		if (isLiquidityProvisionLocked) revert LiquidityProvisionLocked();
		_;
	}

	    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) internal {
        require(token0 < token1);
        address pool = uniswapV3Factory.getPool(token0, token1, fee);

        if (pool == address(0)) {
            pool = uniswapV3Factory.createPool(token0, token1, fee);
            IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        } else {
            (uint160 sqrtPriceX96Existing, , , , , , ) = IUniswapV3Pool(pool).slot0();
            if (sqrtPriceX96Existing == 0) {
                IUniswapV3Pool(pool).initialize(sqrtPriceX96);
            }
        }
        uniswapV3Pool = IUniswapV3Pool(pool);
    }
function mint(uint256 amount) public payable whenNotLocked {
    // Start of non-reentrant section
    isLiquidityProvisionLocked = true;

    uint256 mintCost = calculateMintCost(totalSupply(), amount);
    require(msg.value >= mintCost, "Insufficient ETH sent");

    uint256 fee = amount / feeTier;
    _mint(address(this), fee);

    uint256 remainder = amount - fee;

    _mint(msg.sender, remainder);
    if (msg.value > mintCost) {
        payable(msg.sender).transfer(msg.value - mintCost);

    }

    // If threshold is reached and not locked, provide liquidity
    if (address(this).balance > liquidityProvisionThreshold) {
        provideLiquidity();
    }

    emit TokenMinted(msg.sender, amount);

    // End of non-reentrant section
    isLiquidityProvisionLocked = false;
}

function provideLiquidity() private {
    uint256 ethBalance = address(this).balance;
    if (ethBalance > 0) {
        // Wrap ETH to WETH
        _wrapETH();
    }

    // Mint tokens to the pool

    uint256 tokenBalance = balanceOf(address(this));
    uint256 wethBalance = weth.balanceOf(address(this));

    // Approve spending of WETH and token
    weth.approve(address(uniswapV3Pool), wethBalance);
    this.approve(address(uniswapV3Pool), tokenBalance);

    // Define tickLower, tickUpper, and amount according to your strategy
    (uint256 amount0, uint256 amount1) = uniswapV3Pool.mint(
        address(this), // recipient
        -887272, // tickLower, set to minimum tick for full range
        887272, // tickUpper, set to maximum tick for full range
        uint128(tokenBalance), // amount
        abi.encodePacked(address(this)) // data
    );

    // Additional logic to handle returned values or further actions can be implemented here
    emit LiquidityAdded(ethBalance, tokenBalance, amount0 + amount1);
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


function testProvideLiquidity() public {
    uint256 ethBalance = address(this).balance;

    uint256 tokenBalance = balanceOf(address(this));
    uint256 wethBalance = weth.balanceOf(address(this));


    // Approve spending of WETH and token
    weth.approve(address(uniswapV3Pool), wethBalance);
    this.approve(address(uniswapV3Pool), tokenBalance);

    // Define tickLower, tickUpper, and amount according to your strategy
    try uniswapV3Pool.mint(
        address(this), // recipient
        -887272, // tickLower, set to minimum tick for full range
        887272, // tickUpper, set to maximum tick for full range
        uint128(tokenBalance), // amount
        abi.encodePacked(address(this)) // data
    ) returns (uint256 amount0, uint256 amount1) {
        // Additional logic to handle returned values or further actions can be implemented here
        emit LiquidityAdded(ethBalance, tokenBalance, amount0 + amount1);
    } catch (bytes memory returnData) {
  
    }
}
	

    
        // Additional utility functions or modifications can be added here
    
        event TokenMinted(address indexed to, uint256 amount);
        event TokenBurned(address indexed from, uint256 amount);
        event LiquidityAdded(uint256 ethAmount, uint256 tokenAmount, uint256 liquidity);
    }
    