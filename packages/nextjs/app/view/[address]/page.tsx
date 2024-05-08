"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Token from "../../../../hardhat/deployments/baseSepolia/Token.json";
import { Abi } from "abitype";
import styled from "styled-components";
import { parseUnits } from "viem";
import { useBalance } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Form = styled.div`
  background: #013220;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
`;

const Subtitle = styled.h2`
  margin: 10px 0;
`;

const Input = styled.input`
  padding: 8px;
  margin: 20px 0;
  width: 300px; // Wider input for better accessibility
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px; // Larger font size for readability
`;

const Button = styled.button`
  padding: 12px 24px;
  color: Black;
  background-color: #48bb78; // Use a green shade consistent with other buttons
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px; // Larger text for easier interaction
  margin-top: 20px;
  margin-left: 5px;
  &:hover {
    background-color: #36a167; // Slightly darker on hover for a pleasant effect
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed; // Indicate non-interactive state clearly
  }
`;

const ProgressBarContainer = styled.div`
  background-color: #e0e0e0;
  border-radius: 8px;
  margin: 10px 0;
`;

const ProgressBarFill = styled.div`
  background-color: #76a9fa;
  height: 20px;
  border-radius: 8px;
  transition: width 0.3s ease-in-out;
`;

const ContractPage = () => {
  const [amount, setAmount] = useState<bigint>(BigInt(1));
  const [calculatedEth, setCalculatedEth] = useState<bigint>(BigInt(0));
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
    address: address,
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "totalSupply",
    abi: Token.abi as Abi,
    address: address,
  });

  const {data: calculateMintCost } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "calculateMintCost",
    abi: Token.abi as Abi,
    address: address,
    args: [totalSupply, amount*BigInt(10**18)],
  });

  const {
    writeAsync: mintIt,
    isLoading: mintItLoading,
  } = useScaffoldContractWrite({
    contractName: "Token",
    functionName: "mint",
    address: address,
    args: [amount],
    value: calculateMintCost,
  });

  //handle burn
  const {
    writeAsync: burnIt,
    isLoading: burnItLoading,
  } = useScaffoldContractWrite({
    contractName: "Token",
    functionName: "burn",
    address: address,
    args: [amount],
  });
  

  const handleCalculateEth = async () => {
    const mintamount = amount;
    try {
      const mintCost = calculateMintCost;
      console.log("Mint cost:", mintCost?.toString());
      setCalculatedEth(mintCost || BigInt(0));
      console.log("Mint cost:", mintCost?.toString());
    } catch (error) {
      console.error("Error calculating mint cost:", error);
    }
  };

  const handleMint = () => {
    handleCalculateEth();
    if (address || !mintItLoading) {
      const mintValue = calculateMintCost;
  
      mintIt({
        args: [amount * BigInt(10**18)],
        value: mintValue + BigInt(1),
      })
        .then(() => {
          console.log("Minting successful");
        })
        .catch(error => {
          console.error("Minting failed:", error);
          console.log("Minting:", amount * BigInt(10^18));
        });
    } else {
      alert("Please connect your wallet");
    }
  };

  const handleBurn = () => {
    if (address || !burnItLoading) {
      burnIt({
        args: [amount * BigInt(10**18)],
      })
        .then(() => {
          console.log("Burning successful");
        })
        .catch(error => {
          console.error("Burning failed:", error);
        });
    } else {
      alert("Please connect your wallet");
    }
  }

  const { data: liqBalance, isError, isLoading } = useBalance({ address: address });

  const liqThreshold = BigInt(500000000000000000); // 0.5 ETH in wei

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;

  const balanceInWei = BigInt(liqBalance?.value?.toString() || "0");
  const progress = (Number(balanceInWei) / Number(liqThreshold)) * 100;

  console.log(amount * BigInt(10**18));
  console.log(totalSupply);
  console.log(calculateMintCost);

  return (
    <StyledPage>
      <Form>
        <Title>Contract Address: {address}</Title>
        <Subtitle>Name: {name}</Subtitle>
        <Subtitle>Owner: {owner}</Subtitle>
        <Subtitle>Symbol: {symbol}</Subtitle>
        <p>Liquidity: {liqBalance?.formatted} ETH</p>
        <p>Threshold: 0.5 ETH</p>
        <ProgressBarContainer>
          <ProgressBarFill style={{ width: `${progress}%` }} />
        </ProgressBarContainer>
        <Input type="number" value={Number(amount)} onChange={e => setAmount((BigInt(e.target.value)))} />
        <br />
        <Button onClick={handleMint} disabled={mintItLoading}>
          {mintItLoading ? "Minting..." : "Mint"}
        </Button>
        <Button onClick={handleBurn} disabled={burnItLoading}>
          {burnItLoading ? "Burning..." : "Burn"}
        </Button>
      </Form>
    </StyledPage>
  );
};

export default ContractPage;
