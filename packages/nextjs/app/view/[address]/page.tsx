"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Token from "../../../../hardhat/deployments/baseSepolia/Token.json";
import Profiles from "../../../../hardhat/deployments/baseSepolia/Profiles.json";
import { Abi } from "abitype";
import styled from "styled-components";
import { parseUnits } from "viem";
import { useBalance } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import IPFSSign from "~~/components/IPFSSign";
import { useAccount } from "wagmi";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2; // Ensure it's above other content
`;

const ModalContent = styled.div`
  background: #013220;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  z-index: 3;
`;

//fit text to the container

const Form = styled.div`
  background: #013220;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 700px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  width: 100%;
  font-size: calc(1vw + 1vh); // Larger font size for readability
`;

const Subtitle = styled.h2`
  margin: 10px 0;
  font-size: calc(1vw + 1vh); // Larger font size for readability
`;

const Input = styled.input`
  padding: 8px;
  margin: 20px 0;
  width: 300px; // Wider input for better accessibility
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: calc(1vw + 1vh); // Larger font size for readability
`;

const Button = styled.button`
  padding: 12px 24px;
  color: Black;
  background-color: "#90ee90"; // Use a green shade consistent with other buttons
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

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 20px;
  max-width: 400px;
  border-radius: 10px;
  overflow: hidden;
`;

const DescriptionText = styled.p`
  font-size: 16px;
  color: #666;
  padding: 10px;
`;
const ContractPage = () => {
  const [amount, setAmount] = useState<bigint>(BigInt(1));
  const [calculatedEth, setCalculatedEth] = useState<bigint>(BigInt(0));
  const address = useParams().address;

  //get connected address for owner check
  const connectedAddress = useAccount();

  //modal stuff
  const [showModal, setShowModal] = useState(false);
  const toggleModal = () => setShowModal(!showModal);

  //

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

  const { data: liquidityThresholdMet } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "isLiquidityProvisionLocked",
    abi: Token.abi as Abi,
    address: address,
  });

  const { data: ipfsCID } = useScaffoldContractRead({
    contractName: "Profiles",
    functionName: "ipfsHash",
    abi: Profiles.abi as Abi,
    address: Profiles.address,
    args: [address],

  });

  const { data: description } = useScaffoldContractRead({
    contractName: "Profiles",
    functionName: "descriptions",
    abi: Profiles.abi as Abi,
    address: Profiles.address,
    args: [address],
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
  
      setCalculatedEth(mintCost || BigInt(0));

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

  const ipfsGatewayUrl = "https://ipfs.io/ipfs/";

  return (
    <StyledPage>
      <Form>
      {ipfsCID && (
        <ImageContainer>
          <img src={`${ipfsGatewayUrl}${ipfsCID}`} alt="Profile Image" style={{ width: "100%" }} />
        </ImageContainer>
      )}
      {description && (
        <DescriptionText>{description}</DescriptionText>
      )}
        <Title>Contract Address: {address}</Title>
        <Subtitle>Name: {name}</Subtitle>
        <Subtitle>Owner: {owner}</Subtitle>
        <Subtitle>Symbol: {symbol}</Subtitle>
        <Subtitle>Liquidity: {liqBalance?.formatted} ETH</Subtitle>
        <Subtitle>Threshold: 0.5 ETH</Subtitle>
        <Subtitle>Threshold Met: {liquidityThresholdMet ? "Yes" : "No"}</Subtitle>
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
        {owner == connectedAddress.address && <Button onClick={toggleModal}>Update IPFS & Description</Button>}
      </Form>
      {showModal && (
        <ModalBackground onClick={toggleModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <IPFSSign address={address} />
            <Button onClick={toggleModal}>Close</Button>
          </ModalContent>
        </ModalBackground>
      )}
    </StyledPage>
  );
};

export default ContractPage;
