 // SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./token.sol";

    // Errors 

    /// @notice isnt the allowed token error
    error NotIPFSHash();
    error StartsWithQm();
    error NotValidSignature();
    error NotOwner();
    error DescriptionTooLong();

contract Profiles is EIP712 {
    using ECDSA for bytes32;

    bytes32 public DOMAIN_SEPARATOR;
    mapping (address => string) public ipfsHash;
    mapping(address => string) public descriptions;

    bytes32 constant private MESSAGE_TYPEHASH = keccak256("Message(string _ipfsHash,address _contract)");

    constructor(string memory name, string memory version) EIP712(name, version) {
        DOMAIN_SEPARATOR = _domainSeparatorV4();
    }

    struct Message {
        string _ipfsHash;
        address _contract;
    }

    function createMessage(string memory ipfs_string, address _contract) public view returns (bytes32) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(MESSAGE_TYPEHASH, keccak256(bytes(ipfs_string)), _contract)));
        return digest;
    }

    function recoverSigner(string memory _ipfsHash, address _contract, bytes memory signature) public view returns (address) {
        bytes32 message = createMessage(_ipfsHash, _contract);
        return ECDSA.recover(message, signature);
    }

function setIpfsHash(string memory _ipfsHash, string memory _message, address payable _contract, bytes memory signature) public {
    if (bytes(_ipfsHash).length != 46) {
        revert NotIPFSHash();
    }

    if (bytes(_ipfsHash)[0] != 0x51) {
        revert StartsWithQm();
    }

    if (recoverSigner(_message, _contract, signature) != msg.sender) {
        revert NotValidSignature();
    }

    Token tokenInstance = Token(_contract);

    if (tokenInstance.owner() != msg.sender) {
        revert NotOwner();
    }

    ipfsHash[_contract] = _ipfsHash;
}

    function setDescription(string memory _ipfsHash, address payable _contract, bytes memory signature, string memory _description) public {
        if (bytes(_description).length > 255) {
            revert DescriptionTooLong();
        }

        if (recoverSigner(_ipfsHash, _contract, signature) != msg.sender) {
        revert NotValidSignature();
    }
        
        Token tokenInstance = Token(_contract);

        if (tokenInstance.owner() != msg.sender) {
            revert NotOwner();
        }

        descriptions[_contract] = _description;
    }


}