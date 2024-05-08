// pages/tokens.tsx
"use client";

//address and abi for tokenfactory is at packages/hardhat/deployments/baseSepolia/TokenFactory.json
import styled from "styled-components";
import ContractBounce from "~~/components/ContractBounce";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";


const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TokenCard = styled.div`
  background-color: #013220;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

export default function TokensPage() {
  //use scaffold contract read to read the array on TokenFactory and make a card for each address in the array

  const { data: beans } = useScaffoldContractRead({
    contractName: "TokenFactory",
    functionName: "getTokens",
  });

  console.log(beans);

  //map over the array and make a card for each address using contract bounce which takes an address as a prop

  return (
    <div>
      <Container>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
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
