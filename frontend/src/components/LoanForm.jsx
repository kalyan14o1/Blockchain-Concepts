import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

export default function LoanForm({ accountBalance = '0', ethUsdPrice = 2000, onSuccess }) {
  const { contract } = useWeb3();
  const [amount, setAmount] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Convert account balance to a float
  const balanceFloat = parseFloat(accountBalance);
  
  // Calculate USD value of loan
  const amountInUsd = amount ? parseFloat(amount) * ethUsdPrice : 0;
  
  // Calculate maximum loan amount (2x account balance as per contract)
  const maxLoanAmount = balanceFloat * 2;
  
  // Calculate required collateral (50% of loan amount)
  const requiredCollateral = amount ? parseFloat(amount) / 2 : 0;
  
  // Check if user has enough collateral
  const hasEnoughCollateral = balanceFloat >= requiredCollateral;
  
  // Calculate interest amount (8% for 30 days as per contract)
  const interestAmount = amount ? parseFloat(amount) * 0.08 * (30 / 365) : 0;
  
  // Total repayment amount
  const repaymentAmount = amount ? parseFloat(amount) + interestAmount : 0;

  const handleLoanApplication = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTxHash('');
    setTxStatus('');
    
    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid loan amount');
      return;
    }
    
    if (!agreedToTerms) {
      setError('You must agree to the loan terms and conditions');
      return;
    }
    
    if (!hasEnoughCollateral) {
      setError(`Insufficient collateral. You need at least ${requiredCollateral.toFixed(4)} ETH in your account`);
      return;
    }
    
    try {
      setLoading(true);
      setTxStatus('Waiting for confirmation in your wallet...');
      
      // Convert amount to Wei
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Call the applyForLoan function on the contract
      const tx = await contract.applyForLoan(amountInWei, {
        gasLimit: 300000 // Set a higher gas limit
      });
      
      setTxHash(tx.hash);
      setTxStatus("Transaction pending. Please wait for confirmation...");
      setSuccess("Transaction pending. Please wait for confirmation...");
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setTxStatus("Transaction confirmed!");
        setSuccess(`Loan application for ${amount} ETH submitted successfully. Waiting for approval.`);
        setAmount('');
        setAgreedToTerms(false);
        
        // Trigger parent update
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setTxStatus("Transaction failed");
        setError('Transaction failed. Please try again.');
      }
    } catch (err) {
      console.error('Loan application error:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected in MetaMask.');
      } else if (err.message && err.message.includes('user rejected')) {
        setError('Transaction was rejected by user.');
      } else {
        setError(`Error: ${err.message || 'An error occurred while applying for the loan'}`);
      }
      setTxStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
        Apply for a Loan
      </h3>
      
      <form onSubmit={handleLoanApplication}>
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
              Loan Amount *
            </label>
            <div style={{ display: 'flex' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxLoanAmount.toString()}
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
              ${amountInUsd.toFixed(2)} USD • Max loan: {maxLoanAmount.toFixed(4)} ETH
            </div>
          </div>
          
          <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #E2E8F0' }} />
          
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>Loan Summary</div>
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Loan amount:</span>
                <span>{amount ? parseFloat(amount).toFixed(4) : '0.0000'} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Interest rate:</span>
                <span>8% APR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Loan duration:</span>
                <span>30 days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Required collateral:</span>
                <span style={{ color: hasEnoughCollateral ? '#22543D' : '#C53030' }}>
                  {requiredCollateral.toFixed(4)} ETH
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Interest amount:</span>
                <span>{interestAmount.toFixed(4)} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '500' }}>
                <span>Total repayment:</span>
                <span>{repaymentAmount.toFixed(4)} ETH</span>
              </div>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginRight: '8px' }}
                disabled={loading}
              />
              <span>I agree to the loan terms and conditions</span>
            </label>
          </div>
          
          <button
            type="submit"
            style={{ 
              marginTop: '16px', 
              padding: '10px 16px', 
              backgroundColor: (!amount || !agreedToTerms || !hasEnoughCollateral || loading) ? '#90CDF4' : '#3182CE', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: (!amount || !agreedToTerms || !hasEnoughCollateral || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            disabled={!amount || !agreedToTerms || loading || !hasEnoughCollateral}
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
              'Apply for Loan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}