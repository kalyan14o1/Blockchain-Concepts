import React, { useState, useEffect } from 'react';
import AccountSummary from './AccountSummary';
import DepositForm from './DepositForm';
import WithdrawForm from './WithdrawForm';
import LoanForm from './LoanForm';
import LoanList from './LoanList';
import TransactionHistory from './TransactionHistory';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function Dashboard() {
  const { contract, account, refreshBalance } = useWeb3();
  const [accountBalance, setAccountBalance] = useState('0');
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ethUsdPrice, setEthUsdPrice] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch user data from the contract
  const fetchUserData = async () => {
    try {
      if (contract && account) {
        console.log("Fetching user data from contract...");
        
        try {
          // Get account balance
          const balanceWei = await contract.getAccountBalance();
          const balanceEth = ethers.utils.formatEther(balanceWei);
          setAccountBalance(balanceEth);
          console.log("Account balance:", balanceEth);
        } catch (balanceError) {
          console.error("Error fetching balance:", balanceError);
        }
        
        try {
          // Get user loans
          const loanData = await contract.getUserLoans();
          setLoans(loanData);
        } catch (loanError) {
          console.error("Error fetching loans:", loanError);
        }
        
        try {
          // Get transaction history
          const txHistory = await contract.getUserTransactionHistory();
          setTransactions(txHistory);
        } catch (txError) {
          console.error("Error fetching transaction history:", txError);
        }
        
        try {
          // Get ETH/USD price
          const price = await contract.getEthUsdPrice();
          setEthUsdPrice(price / 10**8); // Convert from 8 decimals
        } catch (priceError) {
          console.error("Error fetching price:", priceError);
          // Default to current price if fetching fails
        }
        
        // Refresh wallet balance
        refreshBalance();
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (contract && account) {
      fetchUserData();
      
      // Set up polling for data refresh every 15 seconds
      const interval = setInterval(() => {
        setRefreshCounter(prev => prev + 1);
      }, 15000);
      
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [contract, account]);
  
  // Refresh data when refreshCounter changes
  useEffect(() => {
    if (contract && account) {
      fetchUserData();
    }
  }, [refreshCounter]);

  // Handle updates after transactions
  const handleUpdate = () => {
    fetchUserData();
    // Force an immediate refresh
    setRefreshCounter(prev => prev + 1);
  };

  // Tab styles
  const tabStyle = {
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent'
  };

  const activeTabStyle = {
    ...tabStyle,
    borderBottom: '2px solid #3182CE',
    fontWeight: 'bold',
    color: '#3182CE'
  };

  // Define content for each tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 0:
        return <DepositForm onSuccess={handleUpdate} />;
      case 1:
        return <WithdrawForm 
          accountBalance={accountBalance} 
          ethUsdPrice={ethUsdPrice}
          onSuccess={handleUpdate} 
        />;
      case 2:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <LoanForm 
              accountBalance={accountBalance} 
              ethUsdPrice={ethUsdPrice}
              onSuccess={handleUpdate} 
            />
            <LoanList 
              loans={loans} 
              ethUsdPrice={ethUsdPrice} 
              onRepaid={handleUpdate} 
            />
          </div>
        );
      case 3:
        return <TransactionHistory 
          transactions={transactions} 
          ethUsdPrice={ethUsdPrice} 
        />;
      default:
        return <DepositForm onSuccess={handleUpdate} />;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '4px solid #EDF2F7', 
            borderTopColor: '#3182CE',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px' }}>Loading your account data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <AccountSummary 
          accountBalance={accountBalance} 
          ethUsdPrice={ethUsdPrice} 
        />
        
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '24px',
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #E2E8F0',
            marginBottom: '20px'
          }}>
            <div 
              style={activeTab === 0 ? activeTabStyle : tabStyle}
              onClick={() => setActiveTab(0)}
            >
              Deposit
            </div>
            <div 
              style={activeTab === 1 ? activeTabStyle : tabStyle}
              onClick={() => setActiveTab(1)}
            >
              Withdraw
            </div>
            <div 
              style={activeTab === 2 ? activeTabStyle : tabStyle}
              onClick={() => setActiveTab(2)}
            >
              Loans
            </div>
            <div 
              style={activeTab === 3 ? activeTabStyle : tabStyle}
              onClick={() => setActiveTab(3)}
            >
              History
            </div>
          </div>
          
          {/* Tab content */}
          <div style={{ padding: '10px 0' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}