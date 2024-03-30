// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapV3Pool.sol";
import "./WETH.sol";
import "hardhat/console.sol"; // Remove this in production

contract Token is ERC20, Ownable, ReentrancyGuard {
	using SafeERC20 for IERC20;

	uint256 public liquidityProvisionThreshold = 5 * 1e18; // Adjust as per your requirement
	bool public isLiquidityProvisionLocked = false;
	// Example fee tier: 1%
	uint24 feeTier = 100;

	IUniswapV3Factory public uniswapV3Factory;
	IUniswapV3Pool public uniswapV3Pool;
	//create a variable to store the weth contract address
	WETH public weth;
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
		address _dummyWETH,
		uint24 _feeTier // 100 = 1% | 3000 = .3% | 5000 = .05% | 10000 = .01%
	) ERC20(name_, symbol_) Ownable(msg.sender) {
		if (_uniswapV3FactoryAddress == address(0)) revert ZeroAddressUsed();

		uniswapV3Factory = IUniswapV3Factory(_uniswapV3FactoryAddress);
		weth = WETH(_dummyWETH);

		// note: maybe set the fee tier here
		feeTier = _feeTier;

		// Create the pool if it doesn't exist
		address pool = uniswapV3Factory.getPool(
			address(this),
			_dummyWETH,
			feeTier
		);
		if (pool == address(0)) {
			pool = uniswapV3Factory.createPool(
				address(this),
				_dummyWETH,
				feeTier
			);
			uniswapV3Pool = IUniswapV3Pool(pool);
			uniswapV3Pool.initialize(1 << 96); // This sets the initial price to 1. Adjust according to your strategy.
		} else {
			uniswapV3Pool = IUniswapV3Pool(pool);
		}
	}

	modifier whenNotLocked() {
		if (isLiquidityProvisionLocked) revert LiquidityProvisionLocked();
		_;
	}

	function mint(uint256 amount) public payable nonReentrant whenNotLocked {
		
		uint256 mintCost = calculateMintCost(totalSupply(), amount);
		require(msg.value >= mintCost, "Insufficient ETH sent");

		uint256 fee = amount / feeTier;
		_mint(address(this), fee);

		uint256 remainder = amount - fee;

		_mint(msg.sender, remainder);
		if (msg.value > mintCost) {
			payable(msg.sender).transfer(msg.value - mintCost);
			//console log
			//print this contracts eth balance
			//console log the uniswapv3 pool address

			console.log("uniswapv3pool address: %s", address(uniswapV3Pool));
			console.log(address(this).balance);
			console.log("Minted %s tokens for %s ETH", amount, mintCost);
        }

        // If threshold is reached and not locked, provide liquidity
				if (address(this).balance > liquidityProvisionThreshold) {
			if (isLiquidityProvisionLocked) revert MintingExceedsThreshold();
			provideLiquidity();
			isLiquidityProvisionLocked = true;
		}


        emit TokenMinted(msg.sender, amount);
    }

function provideLiquidity() private {
    uint256 ethBalance = address(this).balance;
    if (ethBalance > 0) {
        // Wrap ETH to WETH
        _wrapETH();
    }

    // Mint tokens to the pool
    _mint(address(this), totalSupply());

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
			//send the eth to the weth contract
			weth.deposit{value: msg.value}();
		}

		function testProvideLiquidity() public {
    uint256 ethBalance = address(this).balance;


    // Mint tokens to the pool
    _mint(address(this), totalSupply());

    uint256 tokenBalance = balanceOf(address(this));
    uint256 wethBalance = weth.balanceOf(address(this));
	console.log("weth balance: %s", wethBalance);
	console.log("token balance: %s", tokenBalance);

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
	

    
        // Additional utility functions or modifications can be added here
    
        event TokenMinted(address indexed to, uint256 amount);
        event TokenBurned(address indexed from, uint256 amount);
        event LiquidityAdded(uint256 ethAmount, uint256 tokenAmount, uint256 liquidity);
    }
    