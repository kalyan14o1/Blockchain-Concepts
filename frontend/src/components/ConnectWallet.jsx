import React from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function ConnectWallet() {
  const { loading, error, connectWallet } = useWeb3();

  return (
    <div style={{ 
      minHeight: '90vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F7FAFC' 
    }}>
      <div style={{ 
        maxWidth: '445px', 
        width: '100%', 
        backgroundColor: 'white', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
        borderRadius: '8px', 
        padding: '24px', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          height: '210px', 
          backgroundColor: '#3182CE', 
          margin: '-24px -24px 24px -24px', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <span style={{ fontSize: '5rem', color: 'white' }}>👛</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            color: '#38A169', 
            textTransform: 'uppercase', 
            fontWeight: '800', 
            fontSize: '0.875rem', 
            letterSpacing: '1.1px', 
            textAlign: 'center'
          }}>
            Welcome to DeFi Banking
          </div>
          
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '500', 
            textAlign: 'center' 
          }}>
            Connect your wallet to start banking on the blockchain
          </div>
          
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
          
          <button
            style={{ 
              width: '100%', 
              marginTop: '32px', 
              padding: '12px', 
              backgroundColor: '#3182CE', 
              color: 'white', 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 5px 20px 0px rgba(66, 153, 225, 0.43)', 
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#718096', 
            textAlign: 'center' 
          }}>
            Make sure you have MetaMask installed and are connected to the Sepolia network.
          </div>
        </div>
      </div>
    </div>
  );
}