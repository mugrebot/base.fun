// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Interfaces/IUniswapV2Factory.sol";
import "./Interfaces/IUniswapV2Router02.sol";

contract Token is ERC20, Ownable, ReentrancyGuard {
	using SafeERC20 for IERC20;

	uint256 public constant CURVE_CONSTANT = 1 ether;
	uint256 public liquidityProvisionThreshold = 100 * 1e18;

	IUniswapV2Router02 public uniswapV2Router;
	address public uniswapV2Pair;
	address public treasuryWallet;

	mapping(address => bool) private _isExcludedFromFees;
	mapping(address => bool) private automatedMarketMakerPairs;

	error InsufficientETHSent();
	error MintingExceedsThreshold();
	error ZeroAddressUsed();
	error UnauthorizedAccess();

	constructor(
		string memory name_,
		string memory symbol_,
		address _uniswapV2RouterAddress
	) ERC20(name_, symbol_) Ownable(msg.sender) {
		if (_uniswapV2RouterAddress == address(0)) revert ZeroAddressUsed();

		uniswapV2Router = IUniswapV2Router02(_uniswapV2RouterAddress);
		uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).createPair(
				address(this),
				uniswapV2Router.WETH()
			);

		_isExcludedFromFees[owner()] = true;
		_isExcludedFromFees[address(this)] = true;
		automatedMarketMakerPairs[uniswapV2Pair] = true;
	}

	function mint(uint256 amount) public payable nonReentrant {
		if (amount + totalSupply() > liquidityProvisionThreshold)
			revert MintingExceedsThreshold();
		uint256 mintCost = calculateMintCost(totalSupply(), amount);
		if (msg.value < mintCost) revert InsufficientETHSent();

		//need to show corrected amount?

		_mint(msg.sender, amount);
		if (msg.value > mintCost) {
			payable(msg.sender).transfer(msg.value - mintCost);
		}

		if (totalSupply() >= liquidityProvisionThreshold) {
			liquidityProvisionAndBurn();
		}
	}

	function calculateMintCost(
		uint256 currentSupply,
		uint256 mintAmount
	) public pure returns (uint256) {
		return ((mintAmount + currentSupply) * CURVE_CONSTANT) / 1e18;
	}

	function liquidityProvisionAndBurn() private {
		uint256 ethBalance = address(this).balance;
		uint256 tokenBalance = balanceOf(address(this));
		_approve(address(this), address(uniswapV2Router), tokenBalance);

		(, , uint256 liquidity) = uniswapV2Router.addLiquidityETH{
			value: ethBalance
		}(address(this), tokenBalance, 0, 0, treasuryWallet, block.timestamp);

		emit LiquidityAdded(ethBalance, tokenBalance, liquidity);

		uint256 remainingTokens = balanceOf(address(this));
		if (remainingTokens > 0) {
			_burn(address(this), remainingTokens);
			emit TokensBurned(remainingTokens);
		}
	}

	function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
		if (_treasuryWallet == address(0)) revert ZeroAddressUsed();
		treasuryWallet = _treasuryWallet;
	}

	receive() external payable {
		emit ETHReceived(msg.sender, msg.value);

		if (totalSupply() >= liquidityProvisionThreshold) {
			liquidityProvisionAndBurn();
		}

		if (totalSupply() < liquidityProvisionThreshold) {
			mint(msg.value, (msg.value * 1e18) / CURVE_CONSTANT);
		}
	}

	event LiquidityAdded(
		uint256 ethAmount,
		uint256 tokenAmount,
		uint256 liquidity
	);
	event TokensBurned(uint256 amount);
	event ETHReceived(address from, uint256 amount);
}
