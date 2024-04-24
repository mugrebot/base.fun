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

    //array for all tokens created
    //array
    address[] public tokens;
    address parent;

    error TokenNameSymbolExists();

    event TokenCreated(address tokenAddress, address owner, string name, string symbol, uint date);
    

    constructor() Ownable(msg.sender) {}

    function findDeploymentAddress(
        string memory name,
        string memory symbol,
        bytes32 salt
    ) public view returns (address deploymentAddress) {
        bytes memory creationCode = getCreationCode(name, symbol);

        deploymentAddress = address(
            uint160( // downcast to match the address type.
                uint256( // convert to uint to truncate upper digits.
                    keccak256( // compute the CREATE2 hash using 4 inputs.
                        abi.encodePacked( // pack all inputs to the hash together.
                            hex"ff", // start with 0xff to distinguish from RLP.
                            address(this), // this contract will be the caller.
                            salt, // pass in the supplied salt value.
                            keccak256( // pass in the hash of initialization code.
                            abi.encodePacked(creationCode))
                        )
                    )
                )
            )
        );
    }

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
        tokens.push(tokenAddress);
        emit TokenCreated(address(tokenAddress), msg.sender, name, symbol, block.timestamp);
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

    //function to get all tokens created
    function getTokens() external view returns (address[] memory) {
        return tokens;
    }
}
