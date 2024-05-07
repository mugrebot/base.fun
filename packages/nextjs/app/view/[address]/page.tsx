"use client";

import React from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import Token from "../../../../hardhat/deployments/baseSepolia/Token.json";
import { Abi } from "abitype";
import { formatEther, parseEther, parseUnits } from "viem";
import { useBalance } from "wagmi";
import { useContractWrite, useNetwork } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import IPFS from "~~/components/IPFSSign";

const ContractPage = () => {
  const [amount, setAmount] = useState<bigint>(BigInt(1));
  const [calculatedEth, setCalculatedEth] = useState<bigint>(BigInt(0));

  const [isMinimized, setIsMinimized] = useState(true);

  const address = useParams().address;

  const { data: name } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "name",
    abi: Token.abi as Abi,
    address: address,
  });


  const { data: owner } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "owner",
    abi: Token.abi as Abi,
    address: address,
  });



  const { data: symbol } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "symbol",
    abi: Token.abi as Abi,
    address: address as string,
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "totalSupply",
    abi: Token.abi as Abi,
    address: address as string,
  });



  

  const { data: calculateMintCost } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "calculateMintCost",
    abi: Token.abi as Abi,
    address: address as string,
    args: [totalSupply, amount],
  });



  const { writeAsync: mintIt, isLoading: mintItLoading } = useScaffoldContractWrite({
    contractName: "Token",
    functionName: "mint",
    address: address,
    args: [amount],
    value: parseUnits(calculatedEth.toString(), 1),
  });

  const handleCalculateEth = async () => {
    try {
      setCalculatedEth(calculateMintCost || BigInt(0));
    } catch (error) {
      console.error("Error calculating mint cost:", error);
    }
  };

  const handleMint = () => {
    handleCalculateEth();
    if (address || !mintItLoading) {
      const mintValue = parseUnits(calculatedEth.toString(), 0.1);
      mintIt({
        args: [parseUnits(amount.toString(), 0.1)],
        value: mintValue + BigInt(1),
      })
        .then(() => {
          console.log("Minting successful");
        })
        .catch(error => {
          console.error("Minting failed:", error);
        });
    } else {
      alert("Please connect your wallet");
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div>
      <h1>Contract Address: {address}</h1>
      <h2>Name: {name}</h2>
      <h2>Owner: {owner}</h2>
      <h2>Symbol: {symbol}</h2>
      <input type="number" value={Number(amount)} onChange={e => setAmount(BigInt(e.target.value))} />
      <button onClick={handleMint}>Mint</button>

      {!isMinimized && (
            <div>
              <IPFS onMinimize={handleMinimize} />
            </div>
        )}
        {isMinimized && (
          <div style={{ position: "fixed", bottom: 100, left: 10 }}>
            <button onClick={handleMinimize}>[EDIT PROFILE]</button>
          </div>
        )}
    </div>
    
  );
};

export default ContractPage;
