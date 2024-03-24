import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy DummyWETH
  const dummyWETH = await deploy("DummyWETH", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("DummyWETH deployed to:", dummyWETH.address);

  //deploy DummyUniswapFactory
  const _factory = await deploy("DummyUniswapFactory", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  // Deploy DummyUniswapRouter with DummyWETH address
  const dummyUniswapRouter = await deploy("DummyUniswapRouter", {
    from: deployer,
    args: [dummyWETH.address, _factory.address],
    log: true,
    autoMine: true,
  });
  console.log("DummyUniswapRouter deployed to:", dummyUniswapRouter.address);

  // Token contract deployment
  // Assuming Token contract requires name, symbol, and DummyUniswapRouter address as constructor arguments
  const tokenName = "TokenName";
  const tokenSymbol = "TKN";
  const token = await deploy("Token", {
    from: deployer,
    args: [tokenName, tokenSymbol, dummyUniswapRouter.address], // Adjust according to your constructor
    log: true,
    autoMine: true,
  });
  console.log("Token deployed to:", token.address);
};

export default deployContracts;
deployContracts.tags = ["all"];
