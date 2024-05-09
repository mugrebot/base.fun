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

  /*

  const unipooldeployer = await deploy("UniswapV3PoolDeployer", {
    from: deployer,
    args: ["0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24","0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2","0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4"],
    log: true,
    autoMine: true,
  });
  console.log("unipool deployed to:", unipooldeployer.address); 
  */

  const profile_verifier_contract = await deploy("Profiles", {
    from: deployer,
    args: ["TokenProfile", "1"],
    log: true,
    autoMine: true,
  });

  /*

  const tokenName = "FARTBEANS2";
  const tokenSymbol = "BEANS2";
  const WETHaddress = "0x4200000000000000000000000000000000000006";
  const UniswapAddress = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
  const positionManager = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2";
  const treasuryWallet = "0x820AE05036E269BecbD3B01aA7e30bBc9f75026D";
  const token = await deploy("Token", {
    from: deployer,
    args: [
      tokenName,
      tokenSymbol,
      WETHaddress,
      UniswapAddress,
      positionManager,
      treasuryWallet


    ], // Adjust according to your constructor
    log: true,
    autoMine: true,
  });
  console.log("Token deployed to:", token.address);


 
  const tokenDeployer = await deploy("TokenFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("factory deployed to:", tokenDeployer.address); 
*/

  /*

  const BKT = await deploy("BasicToken", {
    from: deployer,
    args: [token.address],
    log: true,
    autoMine: true,
  });
  console.log("unipool deployed to:", BKT.address);
};


//deploy BKT



/*

//deploy BKT
const unipooldeployer = await deploy("UniswapV3PoolDeployer", {
  from: deployer,
  args: ["0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24","0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2","0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4"],
  log: true,
  autoMine: true,
});
console.log("unipool deployed to:", unipooldeployer.address); 
};
*/

};




export default deployContracts;
deployContracts.tags = ["all"];
