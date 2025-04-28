import React from 'react';
import './App.css';
import { Web3Provider } from './context/Web3Context';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ConnectWallet from './components/ConnectWallet';
import { useWeb3 } from './context/Web3Context';

// App content component that uses the Web3 context
function AppContent() {
  const { isConnected } = useWeb3();
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7FAFC' }}>
      <Header />
      {isConnected ? <Dashboard /> : <ConnectWallet />}
    </div>
  );
}

// Main App component that wraps everything with the Web3Provider
function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;