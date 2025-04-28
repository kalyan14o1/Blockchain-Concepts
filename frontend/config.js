export const CONTRACT_ADDRESS = "0x0E9C5f5B0f5c70e178B9F14eF3a716988B86c137";
export const ADMIN_ADDRESS = "0x826F389be2A72c80A8406fB967269c584e00b0Fa";

export const CHAIN_ID = "0xAA36A7"; // Sepolia testnet
export const NETWORK_NAME = "Sepolia";
export const NETWORK_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/4cIZMN7OYiBXnf4U2C_vkJq6UVTPNfzl";

export const CONTRACT_ABI = [
  // Only include what we need for the frontend
  "function deposit() external payable nonReentrant",
  "function withdraw(uint256 _amount) external nonReentrant",
  "function applyForLoan(uint256 _amount) external nonReentrant",
  "function repayLoan(uint256 _loanIndex) external payable nonReentrant",
  "function getAccountBalance() external view returns (uint256)",
  "function getUserLoans() external view returns (tuple(uint256 amount, uint256 dueTimestamp, uint256 interestAmount, bool approved, bool repaid)[])",
  "function getUserTransactionHistory() external view returns (tuple(uint256 amount, uint256 timestamp, uint8 transactionType)[])",
  "function getEthUsdPrice() public view returns (int)"
];