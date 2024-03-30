import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import {
  bytecode as FACTORY_BYTECODE,
} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy DeployBytecode contract
  /*
  const deployBytecodeDeployment = await deploy("DeployBytecode", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("DeployBytecode deployed to:", deployBytecodeDeployment.address);
  */

  // Deploy Uniswap V3 Factory using the DeployBytecode contract
  /*
  const deployBytecodeContract = await ethers.getContractAt("DeployBytecode", deployBytecodeDeployment.address);
  
  const tx = await deployBytecodeContract.deployBytecode(FACTORY_BYTECODE);
  await tx.wait();
  
  const newContractAddress = await tx.wait().then((receipt) => {
    return receipt.logs[0].address; // This may need to be adjusted
  });

  console.log("Uniswap V3 Factory deployed to:", newContractAddress);

  // Deploy DummyWETH
  const dummyWETH = await deploy("WETH", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("DummyWETH deployed to:", dummyWETH.address);
  */

  // Token contract deployment
  const tokenName = "FARTBEANS";
  const tokenSymbol = "BEANS";
  const WETHaddress = "0x4200000000000000000000000000000000000006";
  const UniswapAddress = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
  const token = await deploy("Token", {
    from: deployer, 
    args: [
      tokenName,
      tokenSymbol,
      UniswapAddress,
      WETHaddress,
      3000,
    ], // Adjust according to your constructor
    log: true,
    autoMine: true,
  });
  console.log("Token deployed to:", token.address);
};

export default deployContracts;
deployContracts.tags = ["all"];
