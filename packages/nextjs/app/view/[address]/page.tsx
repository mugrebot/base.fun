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
  color: white;
  background-color: #48bb78; // Use a green shade consistent with other buttons
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px; // Larger text for easier interaction
  margin-top: 20px;
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

  const {
    data: calculateMintCost,
    writeAsync: mintIt,
    isLoading: mintItLoading,
  } = useScaffoldContractWrite({
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

  const { data: liqBalance, isError, isLoading } = useBalance({ address: address });

  const liqThreshold = BigInt(500000000000000000); // 0.5 ETH in wei

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;

  const balanceInWei = BigInt(liqBalance?.value?.toString() || "0");
  const progress = (Number(balanceInWei) / Number(liqThreshold)) * 100;

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
        <Input type="number" value={Number(amount)} onChange={e => setAmount(BigInt(e.target.value))} />
        <Button onClick={handleMint} disabled={mintItLoading}>
          {mintItLoading ? "Minting..." : "Mint"}
        </Button>
      </Form>
    </StyledPage>
  );
};

export default ContractPage;
