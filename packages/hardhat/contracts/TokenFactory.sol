pragma solidity 0.8.20;

import "./interfaces/NoDelegateCall.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./token.sol";


contract TokenFactory is NoDelegateCall, Ownable {
    mapping(string => bool) public tokenNames;
    mapping(string => bool) public tokenSymbols;
    // token array of all created tokens
    address[] public tokens;
    address public immutable WETHaddress = 0x4200000000000000000000000000000000000006;
    address public immutable UniswapAddress = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
    address public immutable positionManager = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;
    address public treasuryWallet = 0x820AE05036E269BecbD3B01aA7e30bBc9f75026D;

    error TokenNameSymbolExists();

    event TokenCreated(address tokenAddress, address owner, string name, string symbol);

    constructor () Ownable(msg.sender) {}

    function createToken(
        string memory name,
        string memory symbol
    ) external noDelegateCall {
        if (tokenNames[name] || tokenSymbols[symbol]) revert TokenNameSymbolExists();
        // Create a new token contract
        Token token = new Token(name, symbol, payable(WETHaddress), UniswapAddress, positionManager, treasuryWallet);

        tokenNames[name] = true;
        tokenSymbols[symbol] = true;
        tokens.push(address(token));
        emit TokenCreated(address(token), msg.sender, name, symbol);
    }

    function setTreasuryWallet(address _treasuryWallet) external noDelegateCall onlyOwner {
        treasuryWallet = _treasuryWallet;
    }

    // get the list of all tokens
    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    // verify a signature for a token is from the owner
    function verifyTokenOwner(address tokenAddress, bytes memory signature) external view returns (bool) {
        return owner() == ECDSA.recover(keccak256(abi.encodePacked(tokenAddress)), signature);
    }


}