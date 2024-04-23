pragma solidity 0.8.20;

import "./interfaces/NoDelegateCall.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./token.sol";

contract TokenFactory is NoDelegateCall, Ownable {
    mapping(string => bool) public tokenNames;
    mapping(string => bool) public tokenSymbols;
    address public WETHaddress = 0x4200000000000000000000000000000000000006;
    address public UniswapAddress = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;
    address public positionManager = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
    address public treasuryWallet = 0x820AE05036E269BecbD3B01aA7e30bBc9f75026D;

    error TokenNameSymbolExists();

    event TokenCreated(address tokenAddress, address owner, string name, string symbol);
    

    constructor() Ownable(msg.sender) {}

     function createToken(
        string memory name,
        string memory symbol,
        bytes32 salt
    ) external noDelegateCall {
        if (tokenNames[name] || tokenSymbols[symbol]) revert TokenNameSymbolExists();

        bytes memory creationCode = getCreationCode(name, symbol);
        address tokenAddress;
        assembly {
            tokenAddress := create2(0, add(creationCode, 0x20), mload(creationCode), salt)
        }

        tokenNames[name] = true;
        tokenSymbols[symbol] = true;
        emit TokenCreated(tokenAddress, msg.sender, name, symbol);
    }

    function getCreationCode(string memory name, string memory symbol)
        public
        view
        returns (bytes memory creationCode)
    {
        creationCode = type(Token).creationCode;
        /// @solidity memory-safe-assembly
        assembly {
        let ptr := add(creationCode, 0x20)
        mstore(ptr, 0x60)
        mstore(add(ptr, 0x20), name)
        mstore(add(ptr, 0x40), symbol)
        mstore(add(ptr, 0x60), sload(WETHaddress.slot))
        mstore(add(ptr, 0x80), sload(UniswapAddress.slot))
        mstore(add(ptr, 0xa0), sload(positionManager.slot))
        mstore(add(ptr, 0xc0), sload(treasuryWallet.slot))
        mstore(creationCode, add(mload(creationCode), 0xe0))
        mstore(0x40, add(creationCode, mload(creationCode)))
        }
    }

    function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
        treasuryWallet = _treasuryWallet;
    }
}
