// pages/tokens.tsx
"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';
import { useProvider, useContract } from 'wagmi';
import { Abi } from 'abitype';
import styled from "styled-components";

//address and abi for tokenfactory is at packages/hardhat/deployments/baseSepolia/TokenFactory.json
import TokenFactory from '../../../hardhat/deployments/baseSepolia/TokenFactory.json';
import Token from '../../../hardhat/deployments/baseSepolia/Token.json';

import { useScaffoldContractRead } from '~~/hooks/scaffold-eth';
import ContractBounce from '~~/components/ContractBounce';

console.log(TokenFactory.address);

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TokenCard = styled.div`
  background-color: #013220;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
`;

export default function TokensPage() {

    //use scaffold contract read to read the array on TokenFactory and make a card for each address in the array

    const { data: beans } = useScaffoldContractRead({
        contractName: "TokenFactory",
        functionName: 'getTokens',
        abi: TokenFactory.abi,
        address: TokenFactory.address,
    });

    console.log(beans);

    //map over the array and make a card for each address using contract bounce which takes an address as a prop

    return (
        <div>
            <Container>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {beans?.map((address: string) => (
                    <TokenCard key={address} style={{ margin: 10 }}>
                        <ContractBounce address={address} />
                    </TokenCard>
                ))}
            </div>
            </Container>
        </div>
    );

}
