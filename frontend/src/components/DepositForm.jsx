import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function DepositForm({ onSuccess }) {
  const { contract, account, balance, refreshBalance } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  const handleDeposit = async (e) => {
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
    
    try {
      setLoading(true);
      
      // Convert amount to Wei
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Check if user has enough balance
      if (ethers.utils.parseEther(balance || '0').lt(amountInWei)) {
        setError('Insufficient balance in your wallet');
        setLoading(false);
        return;
      }

      console.log("Initiating deposit transaction...");
      console.log("Amount:", amountInWei.toString());
      
      setTxStatus('Waiting for confirmation in your wallet...');
      
      // Call the deposit function on the contract
      const tx = await contract.deposit({ 
        value: amountInWei,
        gasLimit: 300000 // Set a higher gas limit to ensure transaction doesn't fail
      });
      
      setTxHash(tx.hash);
      console.log("Transaction sent:", tx.hash);
      
      // Display pending message
      setTxStatus("Transaction pending. Please wait for confirmation...");
      setSuccess("Transaction pending. Please wait for confirmation...");
      
      // Wait for the transaction to be mined
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      if (receipt.status === 1) {
        setTxStatus("Transaction confirmed!");
        setSuccess(`Successfully deposited ${amount} ETH.`);
        setAmount('');
        
        // Refresh balances and data
        refreshBalance();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setTxStatus("Transaction failed");
        setError('Transaction failed. Please try again.');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected in MetaMask.');
      } else if (err.message && err.message.includes('user rejected')) {
        setError('Transaction was rejected by user.');
      } else {
        setError(`Error: ${err.message || 'An error occurred while depositing'}`);
      }
      setTxStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
        Deposit ETH to start earning interest
      </h3>
      
      <form onSubmit={handleDeposit}>
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
              Deposit Amount *
            </label>
            <div style={{ display: 'flex' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              A 1% deposit fee will be applied. Your wallet balance: {parseFloat(balance || 0).toFixed(4)} ETH
            </div>
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
            disabled={!amount || loading || parseFloat(amount) <= 0}
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
              'Deposit'
            )}
          </button>
          
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>
            By depositing, you'll earn 5% annual interest on your ETH balance.
          </div>
        </div>
      </form>
    </div>
  );
}