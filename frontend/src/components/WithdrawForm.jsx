import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function WithdrawForm({ accountBalance = '0', ethUsdPrice = 2000, onSuccess }) {
  const { contract } = useWeb3();
  const [amount, setAmount] = useState('');
  const [percentValue, setPercentValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Convert account balance to a float
  const balanceFloat = parseFloat(accountBalance);
  
  // Calculate USD value of withdrawal
  const amountInUsd = amount ? parseFloat(amount) * ethUsdPrice : 0;

  // Handle slider change
  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setPercentValue(value);
    const calculatedAmount = (balanceFloat * value / 100).toFixed(6);
    setAmount(calculatedAmount);
  };

  // Handle direct input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Update slider if there's a valid balance
    if (balanceFloat > 0 && value) {
      const percent = (parseFloat(value) / balanceFloat) * 100;
      setPercentValue(percent > 100 ? 100 : percent);
    } else {
      setPercentValue(0);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTxHash('');
    setTxStatus('');
    
    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > balanceFloat) {
      setError('Insufficient balance in your account');
      return;
    }
    
    try {
      setLoading(true);
      setTxStatus('Waiting for confirmation in your wallet...');
      
      // Convert amount to Wei
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Call the withdraw function on the contract
      const tx = await contract.withdraw(amountInWei, {
        gasLimit: 300000 // Set a higher gas limit
      });
      
      setTxHash(tx.hash);
      setTxStatus("Transaction pending. Please wait for confirmation...");
      setSuccess("Transaction pending. Please wait for confirmation...");
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setTxStatus("Transaction confirmed!");
        setSuccess(`Successfully withdrawn ${amount} ETH.`);
        setAmount('');
        setPercentValue(0);
        
        // Trigger parent update
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setTxStatus("Transaction failed");
        setError('Transaction failed. Please try again.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected in MetaMask.');
      } else if (err.message && err.message.includes('user rejected')) {
        setError('Transaction was rejected by user.');
      } else {
        setError(`Error: ${err.message || 'An error occurred while withdrawing'}`);
      }
      setTxStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
        Withdraw ETH from your account
      </h3>
      
      <form onSubmit={handleWithdraw}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#FED7D7', 
              color: '#822727', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontWeight: 'bold' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#C6F6D5', 
              color: '#22543D', 
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>✅</span>
                <span>{success}</span>
              </div>
              {txHash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#2B6CB0', 
                    textDecoration: 'underline', 
                    fontSize: '0.875rem',
                    wordBreak: 'break-all'
                  }}
                >
                  View on Etherscan: {txHash}
                </a>
              )}
            </div>
          )}
          
          {txStatus && !error && !success && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#EBF8FF', 
              color: '#2C5282', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ 
                border: '2px solid #2C5282', 
                borderTopColor: 'transparent',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>{txStatus}</span>
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Withdrawal Amount *
            </label>
            <div style={{ display: 'flex' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceFloat.toString()}
                placeholder="0.0"
                value={amount}
                onChange={handleInputChange}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '4px 0 0 4px', 
                  border: '1px solid #E2E8F0', 
                  width: '100%' 
                }}
                disabled={loading}
              />
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#EDF2F7', 
                borderRadius: '0 4px 4px 0',
                border: '1px solid #E2E8F0',
                borderLeft: 'none'
              }}>
                ETH
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '4px' }}>
              ${amountInUsd.toFixed(2)} USD • Available balance: {balanceFloat.toFixed(4)} ETH
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Withdraw percentage: {percentValue.toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={percentValue}
              onChange={handleSliderChange}
              style={{ width: '100%' }}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            style={{ 
              marginTop: '16px', 
              padding: '10px 16px', 
              backgroundColor: loading ? '#90CDF4' : '#3182CE', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            disabled={!amount || loading || parseFloat(amount) <= 0 || parseFloat(amount) > balanceFloat}
          >
            {loading ? (
              <>
                <div style={{ 
                  border: '2px solid white', 
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </>
            ) : (
              'Withdraw'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}