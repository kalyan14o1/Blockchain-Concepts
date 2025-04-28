const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Get the admin address from environment variables
  const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;
  console.log("Admin address:", adminAddress);
  
  // Get the Chainlink ETH/USD price feed address
  const priceFeedAddress = process.env.CHAINLINK_ETH_USD_PRICE_FEED || "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  console.log("Price feed address:", priceFeedAddress);
  
  // Deploy the contract
  const BankingContract = await hre.ethers.getContractFactory("BankingContract");
  const bankingContract = await BankingContract.deploy(adminAddress, priceFeedAddress);
  
  await bankingContract.deployed();
  
  console.log("BankingContract deployed to:", bankingContract.address);

  // Wait for a few block confirmations to ensure the contract is deployed
  console.log("Waiting for block confirmations...");
  await bankingContract.deployTransaction.wait(5);
  
  // Verify the contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: bankingContract.address,
      constructorArguments: [adminAddress, priceFeedAddress],
    });
    console.log("Contract verified successfully on Etherscan!");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });