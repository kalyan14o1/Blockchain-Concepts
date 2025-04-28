import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getEthPrice, getMarketChart } from "../services/apiService";

export default function EthPrice() {
  const [priceData, setPriceData] = useState({ price: 0, change24h: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch current price
        const price = await getEthPrice();
        setPriceData(price);
        
        // Fetch chart data
        const chart = await getMarketChart(7); // Last 7 days
        setChartData(chart);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ETH data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh price every 60 seconds
    const interval = setInterval(fetchData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const isPositiveChange = priceData.change24h >= 0;
  
  return (
    <Box
      bg={useColorModeValue('white', 'gray.700')}
      boxShadow={'xl'}
      rounded={'lg'}
      p={6}
      overflow={'hidden'}
    >
      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        <Box flex="1">
          <Stat>
            <StatLabel fontSize="lg">Ethereum Price</StatLabel>
            <StatNumber fontSize="3xl" my={2}>
              ${priceData.price.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type={isPositiveChange ? 'increase' : 'decrease'} />
              {Math.abs(priceData.change24h).toFixed(2)}% (24h)
            </StatHelpText>
          </Stat>
          
          <Text mt={4} fontSize="sm" color="gray.500">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </Box>
        
        <Box flex="2" height="200px">
          {loading ? (
            <Flex h="100%" align="center" justify="center">
              <Text>Loading chart data...</Text>
            </Flex>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split('/')[1]}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3182ce" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Flex>
    </Box>
  );
}