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

    uint256 public liquidityProvisionThreshold = 500 * 1e18;
    bool public isLiquidityProvisionLocked = false;

    IUniswapV2Router02 public uniswapV2Router;
    address public uniswapV2Pair;
    address public treasuryWallet;

    mapping(address => bool) private _isExcludedFromFees;
    mapping(address => bool) private automatedMarketMakerPairs;

    error InsufficientETHSent();
    error MintingExceedsThreshold();
    error ZeroAddressUsed();
    error UnauthorizedAccess();
    error LiquidityProvisionLocked();

    constructor(string memory name_, string memory symbol_, address _uniswapV2RouterAddress) ERC20(name_, symbol_) Ownable(msg.sender) {
        if (_uniswapV2RouterAddress == address(0)) revert ZeroAddressUsed();

        uniswapV2Router = IUniswapV2Router02(_uniswapV2RouterAddress);
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).createPair(address(this), uniswapV2Router.WETH());

        _isExcludedFromFees[owner()] = true;
        _isExcludedFromFees[address(this)] = true;
        automatedMarketMakerPairs[uniswapV2Pair] = true;
    }

    modifier whenNotLocked() {
        require(!isLiquidityProvisionLocked, "Operation not allowed, contract is locked");
        _;
    }

    function mint(uint256 amount) public payable nonReentrant whenNotLocked {
        uint256 mintCost = calculateMintCost(totalSupply(), amount);
        require(msg.value >= mintCost, "Insufficient ETH sent");

        _mint(msg.sender, amount);
        if (msg.value > mintCost) {
            payable(msg.sender).transfer(msg.value - mintCost);
        }

        emit TokenMinted(msg.sender, amount);
    }

    function burn(uint256 amount) public nonReentrant whenNotLocked {
        uint256 burnProceeds = calculateBurnProceeds(amount);
        require(burnProceeds <= address(this).balance, "Not enough balance in contract to cover burn proceeds");

        _burn(msg.sender, amount);
        payable(msg.sender).transfer(burnProceeds);

        emit TokenBurned(msg.sender, amount);
    }

    function calculateMintCost(uint256 currentSupply, uint256 mintAmount) public pure returns (uint256) {
        return ((_sumOfPriceToNTokens(currentSupply + mintAmount) - _sumOfPriceToNTokens(currentSupply))/(1e18*1e18));
    }

    function calculateBurnProceeds(uint256 amount) public view returns (uint256) {
        uint256 currentSupply = totalSupply();
        require(amount <= currentSupply, "Burn amount exceeds current supply");

        return _sumOfPriceToNTokens(currentSupply) - _sumOfPriceToNTokens(currentSupply - amount);
    }

    function lockLiquidityProvision() external onlyOwner {
        isLiquidityProvisionLocked = true;
    }

    // The price of all tokens from number 1 to n.
    function _sumOfPriceToNTokens(uint256 n) internal pure returns (uint256) {
        return (n + 1) * (2 * n + 1) / 6;
    }

    // Other functions...

    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);
}
