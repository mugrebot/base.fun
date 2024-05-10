"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import TokenFactoryABI from "../../../hardhat/deployments/baseSepolia/TokenFactory.json";
import { Abi } from "abitype";
import styled from "styled-components";
import { useScaffoldContractWrite, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})


const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 55vh;
`;

const Form = styled.div`
  background: #013220;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 700px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 16px;
  color: #4a5568;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e0;
  color: #48bb78;
  border-radius: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  &:focus {
    border-color: #68d391;
    outline: none;
    box-shadow: 0 0 0 3px rgba(104, 211, 145, 0.4);
  }
`;

const Button = styled.button`
  display: block;
  width: 100%;
  background-color: #48bb78;
  color: black;
  border: none;
  padding: 16px;
  font-size: 16px;
  border-radius: 4px;
  margin-top: 24px;
  cursor: pointer;
  &:hover {
    background-color: #38a169;
  }
`;

const Subtitle = styled.h2`
  margin: 10px 0;
  font-size: calc(1vw + 1vh); // Larger font size for readability
  text-decoration: underline;
`;

export default function Deploy() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [transactionResponse, setTransactionResponse] = useState();
  const [blockstart, setBlockStart] = useState(BigInt("9720943") as bigint);

  const { writeAsync: deployToken, isLoading: deployTokenLoading } = useScaffoldContractWrite({
    contractName: "TokenFactory",
    functionName: "createToken",
    abi: TokenFactoryABI.abi as Abi,
    args: [tokenName, tokenSymbol],
  });

  const { data: tokenAddress } = useScaffoldEventHistory({
    contractName: "TokenFactory",
    eventName: "TokenCreated",
    fromBlock: blockstart,
    blockData: true,
    transactionData: true,
    receiptData: true,
    watch: true,
  });

  const handleDeploy = async () => {
    console.log("Deploying Token:", tokenName, tokenSymbol);
    try {

      handleBlockUpdate();
      setTransactionResponse(await deployToken());

      //wait 30 seconds then call handleEventUpdate
      setTimeout(() => {
        handleEventUpdate();
      }, 20000);
    } catch (error) {
      console.error("Error deploying token:", error);
    }
  };

  const handleEventUpdate = async () => {
    try {
      const latestBeans = await tokenAddress; // Assume this function fetches the latest beans array

      const foundEvent = latestBeans?.find(event => event.args[2] === tokenName && event.args[3] === tokenSymbol);

      if (foundEvent) {
        setContractAddress(foundEvent.args[0]); // Assuming args[0] is the address, adjust as needed
      } else {
        console.log("No matching transaction hash found.");
      }
    } catch (error) {
      console.error("Failed to fetch or process beans:", error);
      console.error("updating updating block range");
    }
  };

  const handleBlockUpdate = async () => {
    try {
      const latestBlock = await publicClient.getBlockNumber() 
      console.log("latest block", latestBlock);

      if (latestBlock) {
        setBlockStart(latestBlock); // Assuming args[0] is the address, adjust as needed
      } else {
        console.log("No matching transaction hash found.");
      }
    } catch (error) {
      console.error("Failed to fetch or process beans:", error);
      console.error("updating updating block range");
    }
  }

  useEffect(() => {
    if (tokenAddress) {
      handleEventUpdate();
    }
  }, [handleEventUpdate, tokenAddress]);

  return (
    <Container>
      <Form>
        <Title>Deploy Your Token</Title>
        <div>
          <Label htmlFor="tokenName">Token Name</Label>
          <Input
            id="tokenName"
            value={tokenName}
            onChange={e => setTokenName(e.target.value)}
            placeholder="e.g., DooDooFart"
          />
        </div>
        <div>
          <Label htmlFor="tokenSymbol">Token Symbol</Label>
          <Input
            id="tokenSymbol"
            value={tokenSymbol}
            onChange={e => setTokenSymbol(e.target.value)}
            placeholder="e.g., DDF"
          />
        </div>
        <Button onClick={handleDeploy} disabled={deployTokenLoading}>
          {deployTokenLoading ? "Deploying..." : "Deploy Token"}
        </Button>
        <div>
          {transactionResponse && !contractAddress && <p>Checking the chain....</p>}
          {!transactionResponse && !contractAddress && (
            <Link href={`/view/${contractAddress}`} passHref>
              <Subtitle>deployed at: 0x41e12490c2eE97bD8295051146f00C10D00956dA</Subtitle>
            </Link>
          )}
        </div>
      </Form>
    </Container>
  );
}
