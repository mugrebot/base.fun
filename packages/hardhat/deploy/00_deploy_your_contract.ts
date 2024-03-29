import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  bytecode as FACTORY_BYTECODE,
} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import { ethers } from "hardhat";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Deploy DeployBytecode contract
  const deployBytecodeDeployment = await deploy("DeployBytecode", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("DeployBytecode deployed to:", deployBytecodeDeployment.address);

  // Deploy Uniswap V3 Factory using the DeployBytecode contract
  const deployBytecodeContract = await ethers.getContractAt("DeployBytecode", deployBytecodeDeployment.address);
  
  const tx = await deployBytecodeContract.deployBytecode(FACTORY_BYTECODE);
  await tx.wait();
  
  const newContractAddress = await tx.wait().then((receipt) => {
    // Assuming the contract emits an event with the new contract's address
    // or you could calculate the address based on known Ethereum rules
    return receipt.logs[0].address; // This may need to be adjusted
  });

  console.log("Uniswap V3 Factory deployed to:", newContractAddress);

  // Additional deployment steps...
    // Deploy DummyWETH
    const dummyWETH = await deploy("DummyWETH", {
      from: deployer,
      log: true,
      autoMine: true,
    });
    console.log("DummyWETH deployed to:", dummyWETH.address);
  
  
  
  
    // Token contract deployment
    // Assuming Token contract requires name, symbol, and DummyUniswapRouter address as constructor arguments
    const tokenName = "TokenName";
    const tokenSymbol = "TKN";
    const token = await deploy("Token", {
      from: deployer,
      args: [tokenName, tokenSymbol, newContractAddress, dummyWETH.address], // Adjust according to your constructor
      log: true,
      autoMine: true,
    });
    console.log("Token deployed to:", token.address);
};

export default deployContracts;
deployContracts.tags = ["all"];
