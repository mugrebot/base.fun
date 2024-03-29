"use client";

import React, { useEffect, useState } from "react";
import ABI from "../../../hardhat/deployments/localhost/Token.json";
import { formatUnits, parseEther } from "viem";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export default function TradePage() {
  const [ethAmount, setEthAmount] = useState(BigInt(0) || undefined);
  const [stringEthAmount, setStringEthAmount] = useState("0");
  const [currentSupply, setCurrentSupply] = useState(BigInt(0) || undefined);

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "totalSupply",
  });

  console.log("totalSupply", formatUnits(totalSupply ?? 0n, 18));

  useEffect(() => {
    setCurrentSupply(totalSupply);
  }, [totalSupply]);

  // Assuming calculateMintCost is a read function in your contract
  const { data: mintCost } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "calculateMintCost",
    args: [totalSupply, parseEther(stringEthAmount)], // convert ethAmount to a bigint
  });

  const mintAction = useScaffoldContractWrite({
    contractName: "Token",
    functionName: "mint",
    args: [parseEther(stringEthAmount)], // args should now be an empty array since mint only requires ETH sent
    value: mintCost, // Value is dynamically calculated based on the user's input for ETH amount
    blockConfirmations: 1,
    onBlockConfirmation: result => {
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
    args: ["0x8175634f7989b773c84F7D4Aa593467f0541aB19"],
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
          value={stringEthAmount}
          onChange={e => setStringEthAmount(e.target.value)}
          placeholder="ETH amount"
        />
      </div>
      <div>Calculated mint cost: {formatUnits(mintCost ?? 0n, 18)} ETH</div>
      <button onClick={handleMint} disabled={!stringEthAmount}>
        Mint Token
      </button>
    </div>
  );
}
