import React from "react";
import Link from "next/link";
import Token from "../../hardhat/deployments/baseSepolia/Token.json";
import Profiles from "../../hardhat/deployments/baseSepolia/Profiles.json";
import { Abi } from "abitype";
import styled from "styled-components";
import { useBalance } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

interface ContractBounceProps {
  address: string;
}

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%; // Take the full width to center content
  padding: 20px; // Add some padding around the content
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
  margin-top: 20px;
  margin-bottom: 20px;
  width: 100%; // Ensuring the container takes full width
  max-width: 100px; // Thumbnail size
  height: auto; // Adjust height automatically based on the content
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center; // Center align items vertically
`;


export const ContractBounce: React.FC<ContractBounceProps> = ({ address }) => {
  // I want to get: funded, platform fee, owner, note_balance and regular balance from the contract
  const { data: name } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "name",
    address: address,
  });

  console.log(name);

  const { data: owner } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "owner",
    address: address,
  });

  console.log(owner);

  const { data: symbol } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "symbol",
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

  const { data: liqBalance, isError, isLoading } = useBalance({ address: address });

  //0.5 ether is the threshold for liquidity

  const liqThreshold = BigInt(500000000000000000); // 0.5 ETH in wei

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;

  const balanceInWei = BigInt(liqBalance?.value?.toString() || "0");
  const progress = (Number(balanceInWei) / Number(liqThreshold)) * 100;

  const ipfsGatewayUrl = "https://ipfs.io/ipfs/";


  return (
    <div>
    <CenteredContent>
            {ipfsCID && (
          <ImageContainer>
            <img src={`${ipfsGatewayUrl}${ipfsCID}`} alt="Profile Image" style={{ width: "100%", height: "auto" }} />

          </ImageContainer>
        )}
          <p>Address: {address}</p>
          <p>Owner: {owner}</p>
          <p>Symbol: {symbol}</p>
          <p>Name: {name}</p>
          <p>
            Liquidity: {liqBalance?.formatted} ETH
          </p>
          <div style={{ margin: 5 }}>
            <Link key={address} href={`/view/${address}`} passHref>
              <button>View Contract</button>
            </Link>
          </div>
    </CenteredContent>
    <ProgressBarContainer>
            <ProgressBarFill style={{ width: `${progress}%` }} />
          </ProgressBarContainer>
          
    </div>
  );
};

export default ContractBounce;
