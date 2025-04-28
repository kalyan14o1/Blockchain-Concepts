import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID, NETWORK_NAME } from '../config';

// Create context
const Web3Context = createContext();

// Provider component
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to use this application.');
        setLoading(false);
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        setError('No accounts found. Please connect to MetaMask.');
        setLoading(false);
        return;
      }
      
      // Get the provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();
      
      // Check if connected to the correct network
      const isCorrectChain = chainId === parseInt(CHAIN_ID, 16);
      setIsCorrectNetwork(isCorrectChain);
      
      if (!isCorrectChain) {
        setError(`Please switch to the ${NETWORK_NAME} network`);
        
        // Prompt user to switch networks
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN_ID }],
          });
          
          // Refresh the page after network switch
          window.location.reload();
          return;
        } catch (switchError) {
          // This error code means the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: CHAIN_ID,
                    chainName: NETWORK_NAME,
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/4cIZMN7OYiBXnf4U2C_vkJq6UVTPNfzl'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io/']
                  },
                ],
              });
            } catch (addError) {
              setError(`Could not add the ${NETWORK_NAME} network to your wallet.`);
              setLoading(false);
              return;
            }
          } else {
            setError(`Please add the ${NETWORK_NAME} network to your wallet`);
            setLoading(false);
            return;
          }
        }
      }
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Log for debugging
      console.log("Connected to contract at:", CONTRACT_ADDRESS);
      
      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(address);
      setIsConnected(true);
      
      // Get account ETH balance
      const ethBalance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(ethBalance));
      
      console.log("Connected successfully!", {
        address,
        balance: ethers.utils.formatEther(ethBalance),
        chainId: chainId
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Connection error:", err);
      setError('Failed to connect wallet. Please try again.');
      setIsConnected(false);
      setLoading(false);
    }
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // User switched accounts
      setAccount(accounts[0]);
      if (provider) {
        const ethBalance = await provider.getBalance(accounts[0]);
        setBalance(ethers.utils.formatEther(ethBalance));
      }
    }
  };
  
  // Handle network changes
  const handleChainChanged = () => {
    // Reload page on network change as recommended by MetaMask
    window.location.reload();
  };
  
  // Set up event listeners for account and network changes
  useEffect(() => {
    if (window.ethereum && isConnected) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup function
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isConnected, account]);
  
  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    // Reset state
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setIsConnected(false);
    setBalance(null);
    
    console.log("Wallet disconnected");
  }, []);
  
  // Function to refresh user balance
  const refreshBalance = useCallback(async () => {
    if (provider && account) {
      try {
        console.log("Refreshing wallet balance...");
        const ethBalance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(ethBalance));
        console.log("Updated balance:", ethers.utils.formatEther(ethBalance));
      } catch (error) {
        console.error("Error refreshing balance:", error);
      }
    }
  }, [provider, account]);
  
  // Function to execute contract calls with better error handling
  const executeContractCall = async (methodName, args = [], overrides = {}) => {
    if (!contract) {
      return { 
        success: false, 
        error: new Error("Contract not initialized"), 
        message: "Contract not initialized. Please connect your wallet." 
      };
    }
    
    try {
      console.log(`Calling contract method: ${methodName}`);
      console.log("Arguments:", args);
      console.log("Overrides:", overrides);
      
      // Use spread syntax for args
      const tx = await contract[methodName](...args, {
        gasLimit: 500000, // Default gas limit
        ...overrides
      });
      
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Refresh balances
      refreshBalance();
      
      return { 
        success: true, 
        receipt, 
        hash: tx.hash 
      };
    } catch (error) {
      console.error(`Error in ${methodName}:`, error);
      
      let errorMessage = "Transaction failed";
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = "Transaction was rejected in MetaMask.";
      } else if (error.message && error.message.includes('user rejected')) {
        errorMessage = "Transaction was rejected by user.";
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error, 
        message: errorMessage 
      };
    }
  };
  
  // Function to get contract data with better error handling
  const getContractData = async (methodName, args = []) => {
    if (!contract) {
      return {
        success: false,
        error: new Error("Contract not initialized"),
        message: "Contract not initialized. Please connect your wallet."
      };
    }
    
    try {
      console.log(`Calling contract method: ${methodName}`);
      console.log("Arguments:", args);
      
      const result = await contract[methodName](...args);
      console.log(`Result from ${methodName}:`, result);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error in ${methodName}:`, error);
      return {
        success: false,
        error,
        message: error.message || `Error getting data from ${methodName}`
      };
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        isConnected,
        isCorrectNetwork,
        balance,
        loading,
        error,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        executeContractCall,
        getContractData,
        networkName: NETWORK_NAME
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook for using the context
export const useWeb3 = () => useContext(Web3Context);