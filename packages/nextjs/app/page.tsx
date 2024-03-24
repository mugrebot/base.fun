"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbi, useContractWrite } from "viem";
import { mainnet } from "wagmi";
import tokenAbi from "../../hardhat/deployments/localhost/Token.json";

const tokenContractAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [currentPrice, setCurrentPrice] = useState<number | undefined>();

  // Initialize Viem client for reading contract data
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(`${mainnet.rpcUrls.alchemy.http[0]}/yourAlchemyApiKey`),
  });

  // Define your contract using Viem hooks
  const ABI = parseAbi([
    // Constructor is not needed in ABI for contract interactions
    
    // Token Information
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    
    // Token Ownership
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)",
    
    // Token Balances and Allowances
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    
    // Token Operations
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    
    // Minting New Tokens
    "function mint(uint256 amount) payable",
    "function calculateMintCost(uint256 currentSupply, uint256 mintAmount) pure returns (uint256)",
    
    // Adjusting Token Parameters
    "function setTreasuryWallet(address _treasuryWallet)",
    
    // Uniswap Integration
    "function uniswapV2Pair() view returns (address)",
    "function uniswapV2Router() view returns (address)"
  ]);

  const wagmiConfig = {
    address: tokenContractAddress,
    abi: ABI,
  };

  const reserves = await publicClient.readContract({
    ...wagmiConfig,
    functionName: "getReserves",
  });


  useEffect(() => {
    // Function to fetch the current price for minting 1 token
    const fetchCurrentPrice = async () => {
      try {
        // Assuming calculateMintCost is a view function that calculates the cost of minting 1 token
        const priceForOneToken = await tokenContract.calculateMintCost(await tokenContract.totalSupply(), "1.0");
        setCurrentPrice(parseFloat(priceForOneToken.toString()));
      } catch (error) {
        console.error("Error fetching current price:", error);
      }
    };

    fetchCurrentPrice();
  }, [tokenContract]);

  // Adapted mint function using Viem
  const mintToken = async () => {
    const { write: mint, data, isLoading, isSuccess } = useContractWrite({
      address: tokenContractAddress,
      abi: tokenAbi.abi,
      functionName: 'mint',
      args: [1],
      overrides: {
        value: currentPrice // Make sure this is correctly formatted for your contract's mint function
      },
    });

    if (isSuccess) {
      console.log('Token minted successfully:', data);
    }

    if (isLoading) {
      console.log('Minting in progress...');
    }

    try {
      await mint();
      alert("Token minted successfully!");
    } catch (error) {
      console.error("Minting failed:", error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        {/* Existing content */}
        <div className="mt-8">
          <button onClick={mintToken} className="btn btn-primary" disabled={!connectedAddress || !currentPrice}>
            Mint Token
          </button>
          {currentPrice && (
            <p className="text-lg mt-2">Current Price for 1 Token: {currentPrice} ETH</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
