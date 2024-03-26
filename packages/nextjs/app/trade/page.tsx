"use client";

import React, { useState, useEffect } from 'react';
import ABI from "../../../hardhat/deployments/localhost/Token.json";
import { erc20ABI } from 'wagmi';
import { useScaffoldContractWrite, useScaffoldContractRead } from '~~/hooks/scaffold-eth';
import { parseEther } from 'viem'

export default function TradePage() {
    const [ethAmount, setEthAmount] = useState('');
    const [currentSupply, setCurrentSupply] = useState('');

    const { data: totalSupply } = useScaffoldContractRead({
        contractName: "Token",
        functionName: "totalSupply",
    });

    useEffect(() => {
        setCurrentSupply(totalSupply?.toString() || '');
    }, [totalSupply]);

    // Assuming calculateMintCost is a read function in your contract
    const { data: mintCost } = useScaffoldContractRead({
        contractName: "Token",
        functionName: "calculateMintCost",
        args: [parseEther(currentSupply), parseEther(ethAmount || "0")], // calculateMintCost now requires current supply and the mint amount (derived from ETH amount)
    });

    const mintAction = useScaffoldContractWrite({
        contractName: "Token",
        functionName: "mint",
        args: [parseEther(ethAmount || "0")], // args should now be an empty array since mint only requires ETH sent
        value: mintCost, // Value is dynamically calculated based on the user's input for ETH amount
        blockConfirmations: 1,
        onBlockConfirmation: (result) => {
            console.log("Minted", result);
        },
    });

    const handleMint = async () => {
        try {
            await mintAction.writeAsync();
            console.log("Minting successful");
        } catch (error) {
            console.error("Minting error:", error);
        }
    };

    // Let's show balanceOf address
    const { data: balance } = useScaffoldContractRead({
        contractName: "Token",
        functionName: "balanceOf",
        args: ["0x7808120B921E6dff2CfB1EB16b62559D2185888B"],
    });

    console.log("balance", balance?.toString());

    return (
        <div>
            <h1>Trade Page</h1>
            <div>
                <label htmlFor="ethAmount">ETH amount for minting:</label>
                <input
                    id="ethAmount"
                    type="text"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    placeholder="ETH amount"
                />
            </div>
            <div>
                Calculated mint cost: {mintCost} ETH
            </div>
            <button onClick={handleMint} disabled={!ethAmount}>Mint Token</button>
        </div>
    );
}
