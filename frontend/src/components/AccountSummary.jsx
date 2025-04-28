import React from 'react';

export default function AccountSummary({ accountBalance = '0', ethUsdPrice = 0 }) {
  // Calculate USD value
  const balanceInUsd = parseFloat(accountBalance) * ethUsdPrice;
  
  // Interest rate from contract (5% as defined in the smart contract)
  const interestRate = 5;
  
  return (
    <div style={{
      backgroundColor: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      padding: '24px',
      overflow: 'hidden'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Account Overview
      </h2>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: '1',
          padding: '1rem',
          border: '1px solid #E2E8F0',
          borderRadius: '0.5rem',
          backgroundColor: '#EBF8FF'
        }}>
          <div style={{ color: '#2C5282', fontWeight: '500' }}>Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '500', marginTop: '0.5rem' }}>
            {parseFloat(accountBalance).toFixed(4)} ETH
          </div>
          <div style={{ fontSize: '0.875rem', color: '#4A5568', marginTop: '0.25rem' }}>
            ${balanceInUsd.toFixed(2)} USD
          </div>
        </div>
        
        <div style={{
          flex: '1',
          padding: '1rem',
          border: '1px solid #E2E8F0',
          borderRadius: '0.5rem',
          backgroundColor: '#F0FFF4'
        }}>
          <div style={{ color: '#276749', fontWeight: '500' }}>Interest Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '500', marginTop: '0.5rem' }}>
            {interestRate}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#4A5568', marginTop: '0.25rem' }}>
            Annual percentage yield
          </div>
        </div>
        
        <div style={{
          flex: '1',
          padding: '1rem',
          border: '1px solid #E2E8F0',
          borderRadius: '0.5rem',
          backgroundColor: '#FAF5FF'
        }}>
          <div style={{ color: '#553C9A', fontWeight: '500' }}>ETH Price</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '500', marginTop: '0.5rem' }}>
            ${ethUsdPrice.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#4A5568', marginTop: '0.25rem' }}>
            Current market rate
          </div>
        </div>
      </div>
    </div>
  );
}