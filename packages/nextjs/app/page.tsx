"use client";

import React from "react";
import styled from "styled-components";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #092215; /* A light green background */
  color: "#90ee90"; /* Dark green text for high contrast */
  font-family: Arial, sans-serif;
  width: 100%;
`;
interface CardProps {
  title: string;
  content: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

const Card: React.FC<CardProps> = ({ title, content, buttonLabel, onButtonClick }) => (
  <div className="card">
    <h2>{title}</h2>
    <p>{content}</p>
    {buttonLabel && onButtonClick && <button onClick={onButtonClick}>{buttonLabel}</button>}
  </div>
);

export default function Page() {
  return (
    <StyledPage>
      <Card
        title="Welcome to m00n.fun"
        content="Bonding curve 🤝 Liquidity Pool 
        Deploy a coin, reach the threshold, and release your token to the world with a lil bit of liquidity."
      />
      <Card
        title="Tokenomics"
        content="5% of all tokens purchased sent to contract at the time of mint. Once a liquidity threshold is met, 
         95% of the ETH, (100% - 2% to the contract owner, 1% to the minter who reaches the liquidity threshold, and 1% to the platform)
        are deployed to a Uniswap V3 pool."
      />
      <Card
        title="Uniswap V3 Pool"
        content="The liquidity from token sales is added to a Uniswap V3 pool with a 1% fee, the LP nft will be sent to the burn address (0x...dead)"
      />
      <Card
        title="I think memecoins are bad"
        content="That's great for you, i suggest heading on over to weenie hut jr. thats more your style"
        buttonLabel="Take me to weenie hut jr."
        onButtonClick={() => {
          window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        }}
      />
      <Card
        title="I'm ready to deploy a token"
        content="Great! Click the button below to get started."
        buttonLabel="Deploy Token"
        onButtonClick={() => {
          window.location.href = "/deploy";
        }}
      />
      <br></br>
      <Card
        title="Boilerplate"
        content="m00n.fun does not own any of the tokens deployed on the platform, we are not responsible for any of the tokens deployed on the platform or their performance, Trading crypocurrencies
        carries a high level of risk and may not be suitable for all investors."
      />
    </StyledPage>
  );
}
