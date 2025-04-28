import React, { useState } from 'react';

export default function TransactionHistory({ transactions = [], ethUsdPrice = 2000 }) {
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Transaction type mapping
  const transactionTypes = [
    { value: 0, label: 'Deposit', color: '#68D391' },
    { value: 1, label: 'Withdrawal', color: '#FC8181' },
    { value: 2, label: 'Loan Applied', color: '#F6E05E' },
    { value: 3, label: 'Loan Approved', color: '#63B3ED' },
    { value: 4, label: 'Loan Repaid', color: '#B794F4' },
    { value: 5, label: 'Interest Earned', color: '#4FD1C5' },
  ];

  // Sample transaction data if none provided
  const sampleTransactions = [
    { 
      amount: { toString: () => '0.5' }, 
      timestamp: { toNumber: () => (Date.now() - 2*24*60*60*1000)/1000 }, 
      transactionType: 0 
    },
    { 
      amount: { toString: () => '0.2' }, 
      timestamp: { toNumber: () => (Date.now() - 1*24*60*60*1000)/1000 }, 
      transactionType: 1 
    },
    { 
      amount: { toString: () => '1.0' }, 
      timestamp: { toNumber: () => Date.now()/1000 }, 
      transactionType: 2 
    },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : sampleTransactions;

  // Get transaction type details
  const getTransactionDetails = (typeValue) => {
    return transactionTypes.find(type => type.value === typeValue) || 
      { label: 'Unknown', color: '#A0AEC0' };
  };

  // Filter transactions based on selected filter
  const filteredTransactions = displayTransactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.transactionType === parseInt(filter);
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aTimestamp = a.timestamp && typeof a.timestamp.toNumber === 'function' 
      ? a.timestamp.toNumber() 
      : Date.now()/1000;
    const bTimestamp = b.timestamp && typeof b.timestamp.toNumber === 'function' 
      ? b.timestamp.toNumber() 
      : Date.now()/1000;
    
    if (sortField === 'timestamp') {
      return sortDirection === 'asc' 
        ? aTimestamp - bTimestamp
        : bTimestamp - aTimestamp;
    } else if (sortField === 'amount') {
      const aAmount = parseFloat(a.amount && typeof a.amount.toString === 'function' 
        ? a.amount.toString() 
        : '0');
      const bAmount = parseFloat(b.amount && typeof b.amount.toString === 'function' 
        ? b.amount.toString() 
        : '0');
      return sortDirection === 'asc'
        ? aAmount - bAmount
        : bAmount - aAmount;
    } else if (sortField === 'type') {
      return sortDirection === 'asc'
        ? a.transactionType - b.transactionType
        : b.transactionType - a.transactionType;
    }
    return 0;
  });

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format timestamp to date and time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0 }}>Transaction History</h3>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', marginRight: '8px' }}>Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ 
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Transactions</option>
            {transactionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {sortedTransactions.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px', 
                    borderBottom: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('type')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Type {sortField === 'type' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </div>
                </th>
                <th 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px', 
                    borderBottom: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('amount')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Amount {sortField === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </div>
                </th>
                <th 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px', 
                    borderBottom: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSort('timestamp')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Date & Time {sortField === 'timestamp' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx, index) => {
                const txDetails = getTransactionDetails(tx.transactionType);
                const amountEth = tx.amount && typeof tx.amount.toString === 'function' 
                  ? tx.amount.toString() 
                  : '0';
                const amountUsd = (parseFloat(amountEth) * ethUsdPrice).toFixed(2);
                
                return (
                  <tr key={index}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: txDetails.color + '33', // Adding 33 for transparency
                        color: txDetails.color.replace('33', 'DD') // Darker color for text
                      }}>
                        {txDetails.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                      {amountEth} ETH
                      <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                        ${amountUsd} USD
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                      {formatDateTime(tx.timestamp && typeof tx.timestamp.toNumber === 'function' 
                        ? tx.timestamp.toNumber() 
                        : Date.now()/1000)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div 
          style={{ 
            padding: '20px', 
            textAlign: 'center', 
            backgroundColor: '#F7FAFC',
            borderRadius: '4px'
          }}
        >
          <p>No transactions found.</p>
        </div>
      )}
    </div>
  );
}