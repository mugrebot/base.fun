import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Abi } from "abitype";
import { useDarkMode } from "usehooks-ts";
import { useBalance } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import Token from '../../hardhat/deployments/baseSepolia/Token.json';
import Link from "next/link";
import { SWAP_ROUTER_02_ADDRESSES } from "@uniswap/sdk-core";
import styled from "styled-components";

interface ContractBounceProps {
  address: string;
}

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

export const ContractBounce: React.FC<ContractBounceProps> = ({ address }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  

  const { data: deployedContractData } = useDeployedContractInfo("TokenFactory");

  const { isDarkMode } = useDarkMode();

  // I want to get: funded, platform fee, owner, note_balance and regular balance from the contract
  const { data: name } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "name",
    abi: Token.abi as Abi,
    address: address,
  });

  console.log(name);


  const { data: owner } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "owner",
    abi: Token.abi as Abi,
    address: address,
  });

  console.log(owner);

  const { data: symbol } = useScaffoldContractRead({
    contractName: "Token",
    functionName: "symbol",
    abi: Token.abi as Abi,
    address: address,
  });



  const { data: liqBalance, isError, isLoading } = useBalance({ address: address });

  //0.5 ether is the threshold for liquidity

  const liqThreshold = BigInt(500000000000000000); // 0.5 ETH in wei

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;

  const balanceInWei = BigInt(liqBalance?.value?.toString() || '0');
  const progress = Number(balanceInWei) / Number(liqThreshold) * 100;


  return (
    <div style={{padding: 5}}>
      <div>
        <div style={{ textAlign: "center" }}>
          <p>Address: {address}</p>
          <p>Owner: {owner}</p>
          <p>Symbol: {symbol}</p>
          <p>Name: {name}</p>
          <ProgressBarContainer>
        <ProgressBarFill style={{ width: `${progress}%` }} />
      </ProgressBarContainer>
          <p>Liquidity: {liqBalance?.formatted}
            {liqBalance?.symbol} 
          </p>
          <div style={{ margin: 5 }}>
          <Link key={address} href={`/view/${address}`} passHref>
            <button>View Contract</button>
          </Link>
          

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractBounce;