import React, { useState } from 'react';

export default function LoanList({ loans = [], ethUsdPrice = 2000, onRepaid }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLoanIndex, setSelectedLoanIndex] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('0');

  // Sample loans data for display
  const sampleLoans = [
    {
      amount: { toString: () => '0.5' },
      dueTimestamp: { toNumber: () => new Date().getTime() / 1000 + 30*24*60*60 },
      interestAmount: { toString: () => '0.01' },
      approved: true,
      repaid: false
    },
    {
      amount: { toString: () => '1.0' },
      dueTimestamp: { toNumber: () => new Date().getTime() / 1000 + 15*24*60*60 },
      interestAmount: { toString: () => '0.02' },
      approved: false,
      repaid: false
    }
  ];

  const displayLoans = loans.length > 0 ? loans : sampleLoans;

  const handleRepayModal = (index, amount, interest) => {
    const total = typeof amount === 'object' && amount.toString ? 
      (parseFloat(amount.toString()) + parseFloat(interest.toString())).toString() :
      '0.51';
      
    setSelectedLoanIndex(index);
    setRepaymentAmount(total);
    setIsRepayModalOpen(true);
  };

  const handleRepayLoan = () => {
    setError('');
    setSuccess('');
    
    if (selectedLoanIndex === null) {
      setError('No loan selected');
      return;
    }
    
    setSuccess(`Loan repaid successfully!`);
    setIsRepayModalOpen(false);
    
    if (onRepaid) {
      onRepaid();
    }
  };

  // Helper function to format timestamp to date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Helper function to get loan status text
  const getLoanStatusText = (loan) => {
    if (loan.repaid) return 'Repaid';
    if (loan.approved) return 'Approved';
    return 'Pending';
  };

  // Helper function to get status color
  const getStatusColor = (loan) => {
    if (loan.repaid) return '#68D391';
    if (loan.approved) return '#63B3ED';
    return '#F6E05E';
  };

  // Modal styles
  const modalOverlayStyle = {
    display: isRepayModalOpen ? 'flex' : 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginBottom: '16px' }}>Your Loans</h3>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#FED7D7', color: '#822727', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding: '10px', backgroundColor: '#C6F6D5', color: '#22543D', borderRadius: '4px', marginBottom: '16px' }}>
          {success}
        </div>
      )}
      
      {displayLoans && displayLoans.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0' }}>Due Date</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayLoans.map((loan, index) => (
                <tr key={index}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                    {loan.amount.toString ? loan.amount.toString() : '0.5'} ETH
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                      ${(parseFloat(loan.amount.toString ? loan.amount.toString() : '0.5') * ethUsdPrice).toFixed(2)} USD
                    </div>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                    {formatDate(loan.dueTimestamp.toNumber ? loan.dueTimestamp.toNumber() : Date.now()/1000 + 30*24*60*60)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(loan) + '33', // Adding 33 for transparency
                      color: getStatusColor(loan).replace('33', 'DD') // Darker color for text
                    }}>
                      {getLoanStatusText(loan)}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                    {loan.approved && !loan.repaid && (
                      <button 
                        onClick={() => handleRepayModal(index, loan.amount, loan.interestAmount)}
                        style={{
                          backgroundColor: '#38A169',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Repay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: '#718096' }}>
          You have no loans yet. Apply for a loan to get started.
        </div>
      )}
      
      {/* Repay Loan Modal */}
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Repay Loan</h3>
            <button 
              onClick={() => setIsRepayModalOpen(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '1.5rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p>Please confirm the repayment amount including interest:</p>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Repayment Amount
              </label>
              <input
                type="number"
                value={repaymentAmount}
                readOnly
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#718096' }}>
              ${(parseFloat(repaymentAmount) * ethUsdPrice).toFixed(2)} USD
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setIsRepayModalOpen(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#718096',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '8px 16px',
                marginRight: '8px',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleRepayLoan}
              style={{
                backgroundColor: '#38A169',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Repayment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}