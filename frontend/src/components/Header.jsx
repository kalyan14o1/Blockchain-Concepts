import React from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function Header() {
  const { isConnected, account, balance, connectWallet, disconnectWallet } = useWeb3();

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#3182CE',
        color: 'white',
        minHeight: '60px',
        padding: '8px 16px',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <h1 style={{ 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white',
            margin: 0
          }}>
            DeFi Banking
          </h1>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '24px',
          alignItems: 'center'
        }}>
          {isConnected ? (
            <>
              <div style={{ marginRight: '16px', textAlign: 'right' }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>
                  {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH'}
                </div>
                <div style={{ color: 'white', fontSize: '0.875rem' }}>
                  {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ''}
                </div>
              </div>
              <button
                style={{
                  display: 'inline-flex',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#F56565',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              style={{
                display: 'inline-flex',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#38A169',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}