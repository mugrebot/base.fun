// pages/deploy.tsx
"use client";

import React, { useState } from "react";

export default function Deploy() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const handleDeploy = async () => {
    console.log("Deploying Token:", tokenName, tokenSymbol);
    // Add the logic to interact with your smart contract here
  };

  return (
    <div className="flex justify-center items-center h-screen bg-green-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold mb-4">Deploy Your Token</h1>
        <div>
          <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700">
            Token Name
          </label>
          <input
            type="text"
            id="tokenName"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="e.g., DooDooFart"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-700">
            Token Symbol
          </label>
          <input
            type="text"
            id="tokenSymbol"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            placeholder="e.g., $DDF"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
        </div>
        <button
          onClick={handleDeploy}
          className="mt-6 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Deploy Token
        </button>
      </div>
    </div>
  );
}
