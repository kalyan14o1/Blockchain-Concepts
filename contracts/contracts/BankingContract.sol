// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title DeFi Banking Smart Contract
 * @dev A decentralized banking application that allows users to deposit ETH,
 * apply for loans, earn interest, and withdraw funds.
 */
contract BankingContract is Ownable, ReentrancyGuard {
    // Chainlink ETH/USD Price Feed
    AggregatorV3Interface private priceFeed;
    
    // Admin address for fee collection
    address public adminAddress;
    
    // Constants
    uint256 public constant DEPOSIT_FEE_PERCENT = 1; // 1% fee on deposits
    uint256 public constant INTEREST_RATE_PERCENT = 5; // 5% Annual interest rate for deposits
    uint256 public constant LOAN_INTEREST_RATE_PERCENT = 8; // 8% Annual interest rate for loans
    uint256 public constant LOAN_DURATION_DAYS = 30; // 30 days loan duration
    
    // Struct to store user account details
    struct Account {
        uint256 balance;
        uint256 depositTimestamp;
        bool exists;
    }
    
    // Struct to store loan details
    struct Loan {
        uint256 amount;
        uint256 dueTimestamp;
        uint256 interestAmount;
        bool approved;
        bool repaid;
    }
    
    // Mapping to store user accounts
    mapping(address => Account) public accounts;
    
    // Mapping to store user loans
    mapping(address => Loan[]) public loans;
    
    // Mapping to store user transaction history
    mapping(address => Transaction[]) public transactionHistory;
    
    // Enum to track transaction types
    enum TransactionType { Deposit, Withdrawal, LoanApplied, LoanApproved, LoanRepaid, InterestEarned }
    
    // Struct to store transaction details
    struct Transaction {
        uint256 amount;
        uint256 timestamp;
        TransactionType transactionType;
    }
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event LoanApplied(address indexed user, uint256 amount, uint256 timestamp);
    event LoanApproved(address indexed user, uint256 amount, uint256 dueTimestamp);
    event LoanRepaid(address indexed user, uint256 amount, uint256 timestamp);
    event InterestPaid(address indexed user, uint256 amount, uint256 timestamp);
    
    /**
     * @dev Constructor to initialize the contract with admin address and price feed
     * @param _adminAddress Address where fees will be sent
     * @param _priceFeedAddress Chainlink ETH/USD price feed address
     */
    constructor(address _adminAddress, address _priceFeedAddress) {
        require(_adminAddress != address(0), "Invalid admin address");
        adminAddress = _adminAddress;
        
        // Initialize Chainlink price feed
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    
    /**
     * @dev Updates the admin address
     * @param _newAdminAddress New admin address
     */
    function updateAdminAddress(address _newAdminAddress) external onlyOwner {
        require(_newAdminAddress != address(0), "Invalid admin address");
        adminAddress = _newAdminAddress;
    }
    
    /**
     * @dev Allows users to deposit ETH into their account
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        // Calculate fee
        uint256 fee = (msg.value * DEPOSIT_FEE_PERCENT) / 100;
        uint256 depositAmount = msg.value - fee;
        
        // Transfer fee to admin
        (bool success, ) = adminAddress.call{value: fee}("");
        require(success, "Fee transfer failed");
        
        // Update user account
        if (!accounts[msg.sender].exists) {
            accounts[msg.sender] = Account({
                balance: depositAmount,
                depositTimestamp: block.timestamp,
                exists: true
            });
        } else {
            // Calculate and add any earned interest before adding new deposit
            uint256 interestEarned = calculateInterest(msg.sender);
            if (interestEarned > 0) {
                accounts[msg.sender].balance += interestEarned;
                
                // Record interest transaction
                recordTransaction(msg.sender, interestEarned, TransactionType.InterestEarned);
                emit InterestPaid(msg.sender, interestEarned, block.timestamp);
            }
            
            accounts[msg.sender].balance += depositAmount;
            accounts[msg.sender].depositTimestamp = block.timestamp;
        }
        
        // Record deposit transaction
        recordTransaction(msg.sender, depositAmount, TransactionType.Deposit);
        emit Deposited(msg.sender, depositAmount, block.timestamp);
    }
    
    /**
     * @dev Allows users to withdraw their funds
     * @param _amount Amount to withdraw
     */
    function withdraw(uint256 _amount) external nonReentrant {
        require(accounts[msg.sender].exists, "Account does not exist");
        
        // Calculate and add any earned interest before withdrawal
        uint256 interestEarned = calculateInterest(msg.sender);
        if (interestEarned > 0) {
            accounts[msg.sender].balance += interestEarned;
            
            // Record interest transaction
            recordTransaction(msg.sender, interestEarned, TransactionType.InterestEarned);
            emit InterestPaid(msg.sender, interestEarned, block.timestamp);
        }
        
        require(accounts[msg.sender].balance >= _amount, "Insufficient balance");
        
        // Update balance
        accounts[msg.sender].balance -= _amount;
        accounts[msg.sender].depositTimestamp = block.timestamp;
        
        // Transfer funds to user
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Withdrawal transfer failed");
        
        // Record withdrawal transaction
        recordTransaction(msg.sender, _amount, TransactionType.Withdrawal);
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }
    
    /**
     * @dev Allows users to apply for a loan
     * @param _amount Loan amount requested
     */
    function applyForLoan(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Loan amount must be greater than 0");
        require(accounts[msg.sender].exists, "Must have an account to apply for a loan");
        
        // Check if user has enough collateral (at least 50% of loan amount)
        uint256 requiredCollateral = _amount / 2;
        require(accounts[msg.sender].balance >= requiredCollateral, "Insufficient collateral");
        
        // Calculate interest amount
        uint256 interestAmount = (_amount * LOAN_INTEREST_RATE_PERCENT * LOAN_DURATION_DAYS) / (100 * 365);
        
        // Create loan application (unapproved initially)
        loans[msg.sender].push(Loan({
            amount: _amount,
            dueTimestamp: block.timestamp + (LOAN_DURATION_DAYS * 1 days),
            interestAmount: interestAmount,
            approved: false,
            repaid: false
        }));
        
        // Record loan application transaction
        recordTransaction(msg.sender, _amount, TransactionType.LoanApplied);
        emit LoanApplied(msg.sender, _amount, block.timestamp);
    }
    
    /**
     * @dev Allows admin to approve a user's loan
     * @param _user User address
     * @param _loanIndex Index of the loan in the user's loans array
     */
    function approveLoan(address _user, uint256 _loanIndex) external onlyOwner {
        require(loans[_user].length > _loanIndex, "Loan does not exist");
        require(!loans[_user][_loanIndex].approved, "Loan already approved");
        require(!loans[_user][_loanIndex].repaid, "Loan already repaid");
        
        // Approve the loan
        loans[_user][_loanIndex].approved = true;
        
        // Transfer loan amount to user
        (bool success, ) = _user.call{value: loans[_user][_loanIndex].amount}("");
        require(success, "Loan transfer failed");
        
        // Record loan approval transaction
        recordTransaction(_user, loans[_user][_loanIndex].amount, TransactionType.LoanApproved);
        emit LoanApproved(_user, loans[_user][_loanIndex].amount, loans[_user][_loanIndex].dueTimestamp);
    }
    
    /**
     * @dev Allows users to repay their loan
     * @param _loanIndex Index of the loan to repay
     */
    function repayLoan(uint256 _loanIndex) external payable nonReentrant {
        require(loans[msg.sender].length > _loanIndex, "Loan does not exist");
        require(loans[msg.sender][_loanIndex].approved, "Loan not approved");
        require(!loans[msg.sender][_loanIndex].repaid, "Loan already repaid");
        
        Loan storage loan = loans[msg.sender][_loanIndex];
        uint256 repaymentAmount = loan.amount + loan.interestAmount;
        
        require(msg.value >= repaymentAmount, "Insufficient repayment amount");
        
        // Mark loan as repaid
        loan.repaid = true;
        
        // Transfer interest to admin
        (bool successAdmin, ) = adminAddress.call{value: loan.interestAmount}("");
        require(successAdmin, "Interest transfer to admin failed");
        
        // Return any excess payment
        if (msg.value > repaymentAmount) {
            (bool successRefund, ) = msg.sender.call{value: msg.value - repaymentAmount}("");
            require(successRefund, "Refund transfer failed");
        }
        
        // Record loan repayment transaction
        recordTransaction(msg.sender, repaymentAmount, TransactionType.LoanRepaid);
        emit LoanRepaid(msg.sender, repaymentAmount, block.timestamp);
    }
    
    /**
     * @dev Calculates interest earned on deposits
     * @param _user User address
     * @return Interest amount earned
     */
    function calculateInterest(address _user) public view returns (uint256) {
        if (!accounts[_user].exists || accounts[_user].balance == 0) {
            return 0;
        }
        
        // Calculate time passed since last deposit (in seconds)
        uint256 timeElapsed = block.timestamp - accounts[_user].depositTimestamp;
        
        // Convert time to years for annual interest calculation
        uint256 timeElapsedInYears = timeElapsed / (365 days);
        uint256 remainingSeconds = timeElapsed % (365 days);
        
        // Calculate interest: principal * rate * time
        uint256 interestForFullYears = accounts[_user].balance * INTEREST_RATE_PERCENT * timeElapsedInYears / 100;
        uint256 interestForRemainingTime = accounts[_user].balance * INTEREST_RATE_PERCENT * remainingSeconds / (100 * 365 days);
        
        return interestForFullYears + interestForRemainingTime;
    }
    
    /**
     * @dev Gets the latest ETH/USD price from Chainlink
     * @return ETH price in USD with 8 decimals
     */
    function getEthUsdPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        
        return price;
    }
    
    /**
     * @dev Gets the user's account balance
     * @return User's balance including earned interest
     */
    function getAccountBalance() external view returns (uint256) {
        if (!accounts[msg.sender].exists) {
            return 0;
        }
        
        uint256 interestEarned = calculateInterest(msg.sender);
        return accounts[msg.sender].balance + interestEarned;
    }
    
    /**
     * @dev Gets the user's loan details
     * @return Array of user's loans
     */
    function getUserLoans() external view returns (Loan[] memory) {
        return loans[msg.sender];
    }
    
    /**
     * @dev Gets the user's transaction history
     * @return Array of user's transactions
     */
    function getUserTransactionHistory() external view returns (Transaction[] memory) {
        return transactionHistory[msg.sender];
    }
    
    /**
     * @dev Records a transaction in the user's history
     * @param _user User address
     * @param _amount Transaction amount
     * @param _type Transaction type
     */
    function recordTransaction(address _user, uint256 _amount, TransactionType _type) internal {
        transactionHistory[_user].push(Transaction({
            amount: _amount,
            timestamp: block.timestamp,
            transactionType: _type
        }));
    }
    
    /**
     * @dev Allows the contract to receive ETH
     */
    receive() external payable {
        // Auto-deposit when receiving ETH
        if (msg.value > 0) {
            // Cannot call deposit() directly here due to gas limitations,
            // so we simply emit an event to notify the sender to call deposit() separately
            emit Deposited(msg.sender, msg.value, block.timestamp);
        }
    }
}