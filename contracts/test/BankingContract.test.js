const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BankingContract", function () {
  let bankingContract;
  let owner;
  let user1;
  let user2;
  let admin;
  let priceFeedMock;
  
  const ONE_ETH = ethers.utils.parseEther("1.0");
  const HALF_ETH = ethers.utils.parseEther("0.5");
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, admin] = await ethers.getSigners();
    
    // Deploy a mock price feed contract
    const PriceFeedMock = await ethers.getContractFactory("MockV3Aggregator");
    priceFeedMock = await PriceFeedMock.deploy(8, 200000000000); // 8 decimals, $2000.00000000
    await priceFeedMock.deployed();
    
    // Deploy the banking contract
    const BankingContract = await ethers.getContractFactory("BankingContract");
    bankingContract = await BankingContract.deploy(admin.address, priceFeedMock.address);
    await bankingContract.deployed();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await bankingContract.owner()).to.equal(owner.address);
    });
    
    it("Should set the right admin address", async function () {
      expect(await bankingContract.adminAddress()).to.equal(admin.address);
    });
  });
  
  describe("Deposit", function () {
    it("Should allow users to deposit ETH", async function () {
      // Deposit 1 ETH
      await bankingContract.connect(user1).deposit({ value: ONE_ETH });
      
      // Check balance (99% of 1 ETH because of 1% fee)
      const expectedBalance = ONE_ETH.mul(99).div(100);
      expect(await bankingContract.getAccountBalance({ from: user1.address })).to.be.closeTo(expectedBalance, 1000);
    });
    
    it("Should collect deposit fees", async function () {
      const initialAdminBalance = await ethers.provider.getBalance(admin.address);
      
      // Deposit 1 ETH
      await bankingContract.connect(user1).deposit({ value: ONE_ETH });
      
      // Check admin balance (should have received 1% fee)
      const expectedFee = ONE_ETH.mul(1).div(100);
      const finalAdminBalance = await ethers.provider.getBalance(admin.address);
      expect(finalAdminBalance.sub(initialAdminBalance)).to.equal(expectedFee);
    });
  });
  
  describe("Withdraw", function () {
    beforeEach(async function () {
      // Deposit 1 ETH first
      await bankingContract.connect(user1).deposit({ value: ONE_ETH });
    });
    
    it("Should allow users to withdraw their funds", async function () {
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      
      // Withdraw half of the deposit
      const withdrawAmount = HALF_ETH.mul(99).div(100); // 99% of 0.5 ETH (fee adjusted)
      const tx = await bankingContract.connect(user1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Check user balance
      const finalUserBalance = await ethers.provider.getBalance(user1.address);
      expect(finalUserBalance).to.be.closeTo(
        initialUserBalance.add(withdrawAmount).sub(gasUsed),
        1000 // Allow for small rounding errors
      );
    });
    
    it("Should fail if user tries to withdraw more than their balance", async function () {
      // Try to withdraw more than deposited
      const tooMuch = ONE_ETH.mul(2);
      await expect(bankingContract.connect(user1).withdraw(tooMuch))
        .to.be.revertedWith("Insufficient balance");
    });
  });
  
  describe("Loans", function () {
    beforeEach(async function () {
      // Deposit 1 ETH first to have collateral
      await bankingContract.connect(user1).deposit({ value: ONE_ETH });
    });
    
    it("Should allow users to apply for loans", async function () {
      // Apply for a loan of 0.5 ETH
      await bankingContract.connect(user1).applyForLoan(HALF_ETH);
      
      // Get user loans
      const loans = await bankingContract.connect(user1).getUserLoans();
      expect(loans.length).to.equal(1);
      expect(loans[0].amount).to.equal(HALF_ETH);
      expect(loans[0].approved).to.be.false;
    });
    
    it("Should allow admin to approve loans", async function () {
      // Apply for a loan
      await bankingContract.connect(user1).applyForLoan(HALF_ETH);
      
      // Get initial balances
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      
      // Approve the loan
      await bankingContract.connect(owner).approveLoan(user1.address, 0);
      
      // Check if loan was approved
      const loans = await bankingContract.connect(user1).getUserLoans();
      expect(loans[0].approved).to.be.true;
      
      // Check if user received the loan amount
      const finalUserBalance = await ethers.provider.getBalance(user1.address);
      expect(finalUserBalance).to.be.closeTo(
        initialUserBalance.add(HALF_ETH),
        1000 // Allow for small rounding errors
      );
    });
    
    it("Should allow users to repay loans", async function () {
      // Apply for and approve a loan
      await bankingContract.connect(user1).applyForLoan(HALF_ETH);
      await bankingContract.connect(owner).approveLoan(user1.address, 0);
      
      // Get the loan details
      const loans = await bankingContract.connect(user1).getUserLoans();
      const repaymentAmount = loans[0].amount.add(loans[0].interestAmount);
      
      // Repay the loan
      await bankingContract.connect(user1).repayLoan(0, { value: repaymentAmount });
      
      // Check if loan was marked as repaid
      const updatedLoans = await bankingContract.connect(user1).getUserLoans();
      expect(updatedLoans[0].repaid).to.be.true;
    });
  });
  
  describe("Interest Calculation", function () {
    it("Should calculate interest correctly", async function () {
      // Deposit 1 ETH
      await bankingContract.connect(user1).deposit({ value: ONE_ETH });
      
      // Fast forward time by 1 year (in seconds)
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Check interest earned (should be 5% of deposit amount after fee)
      const depositAfterFee = ONE_ETH.mul(99).div(100);
      const expectedInterest = depositAfterFee.mul(5).div(100);
      
      const interest = await bankingContract.calculateInterest(user1.address);
      expect(interest).to.be.closeTo(expectedInterest, 1000); // Allow small rounding errors
    });
  });
  
  describe("Transaction History", function () {
    it("Should record transaction history", async function () {
      // Deposit ETH
      await bankingContract.connect(user1).deposit({ value: ONE_ETH });
      
      // Withdraw some ETH
      const withdrawAmount = HALF_ETH.mul(99).div(100); // 99% of 0.5 ETH (fee adjusted)
      await bankingContract.connect(user1).withdraw(withdrawAmount);
      
      // Check transaction history
      const history = await bankingContract.connect(user1).getUserTransactionHistory();
      expect(history.length).to.equal(2); // 1 deposit + 1 withdrawal
      expect(history[0].transactionType).to.equal(0); // Deposit
      expect(history[1].transactionType).to.equal(1); // Withdrawal
    });
  });
});

// Mock Price Feed for testing
const MockV3Aggregator = {
  abi: [
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "_decimals",
          "type": "uint8"
        },
        {
          "internalType": "int256",
          "name": "_initialAnswer",
          "type": "int256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestRoundData",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "internalType": "int256",
          "name": "answer",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "startedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "updatedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "answeredInRound",
          "type": "uint80"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  bytecode: "0x608060405234801561001057600080fd5b506040516103bc3803806103bc83398101604081905261002f91610037565b6000919091555060006100de565b6000806040838503121561004a57600080fd5b825160ff8116811461005b57600080fd5b602084015190925090506100ce565b634e487b7160e01b600052604160045260246000fd5b60005b838110156100a1578181015183820152602001610089565b838111156100b0576000848401525b50505050565b600082601f8301126100c757600080fd5b6100d7838335602085016100d6565b9392505050565b610f806000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063313ce5671461003b5780639a6fc8f51461004f575b600080fd5b60408051600881526020810190915261006e565b6100536100ad565b6040805169ffffffffffffffffffff968716815294909516602086015260ff909316928401929092526060830152608082015260a0016100a7565b60405180910390f35b60405161ffff909116815260200161006e565b6000806000806000805460ff16600081815291829160ff1a60f81b0184600681811061010557634e487b7160e01b600052603260045260246000fd5b9050600181600116156101000203166002900460ff1681548110610148575b5050506000805490508060001a60f81b5b906000915090919293949596565b634e487b7160e01b600052603260045260246000fd5b600080fdfea2646970667358221220b2c52098a5a19ff61ebbee1fd61a1b8f9f4768c6c2e5f43d1cb5ca409d478b7164736f6c63430008000033"
};

// Register the mock contract in ethers
ethers.getContractFactory = async function(contractName) {
  if (contractName === "MockV3Aggregator") {
    return {
      deploy: async function(decimals, initialAnswer) {
        // Create a contract factory
        const factory = new ethers.ContractFactory(
          MockV3Aggregator.abi,
          MockV3Aggregator.bytecode,
          owner
        );
        return await factory.deploy(decimals, initialAnswer);
      }
    };
  }
  
  // For any other contract, use the actual implementation
  return this.origGetContractFactory(contractName);
};

// Store the original method
ethers.origGetContractFactory = ethers.getContractFactory;