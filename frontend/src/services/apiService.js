import axios from 'axios';

const API_BASE_URL = 'https://api.coingecko.com/api/v3';

export const getEthPrice = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/simple/price`, {
      params: {
        ids: 'ethereum',
        vs_currencies: 'usd',
        include_24hr_change: true
      }
    });
    
    return {
      price: response.data.ethereum.usd,
      change24h: response.data.ethereum.usd_24h_change
    };
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return { price: 0, change24h: 0 };
  }
};

export const getMarketChart = async (days = 7) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coins/ethereum/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days
      }
    });
    
    // Format data for charts
    const priceData = response.data.prices.map(item => ({
      timestamp: new Date(item[0]).toLocaleDateString(),
      price: item[1]
    }));
    
    return priceData;
  } catch (error) {
    console.error('Error fetching market chart:', error);
    return [];
  }
};

export const getGasPrice = async () => {
  try {
    // Using Etherscan API to get gas price
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'gastracker',
        action: 'gasoracle',
        apikey: 'YourEtherscanApiKey' // Replace with your Etherscan API key
      }
    });
    
    if (response.data.status === '1') {
      return {
        low: response.data.result.SafeGasPrice,
        average: response.data.result.ProposeGasPrice,
        high: response.data.result.FastGasPrice
      };
    }
    
    return { low: '0', average: '0', high: '0' };
  } catch (error) {
    console.error('Error fetching gas price:', error);
    return { low: '0', average: '0', high: '0' };
  }
};

// Notification service using Web Notifications API
export const sendNotification = (title, body, icon = null) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }
  
  // Check if permission is granted
  if (Notification.permission === "granted") {
    createNotification(title, body, icon);
  } 
  // Otherwise, ask for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        createNotification(title, body, icon);
      }
    });
  }
};

// Helper function to create notification
const createNotification = (title, body, icon) => {
  const options = {
    body: body,
    icon: icon || '/favicon.ico'
  };
  
  const notification = new Notification(title, options);
  
  notification.onclick = function() {
    window.focus();
    this.close();
  };
  
  // Auto close after 5 seconds
  setTimeout(notification.close.bind(notification), 5000);
};