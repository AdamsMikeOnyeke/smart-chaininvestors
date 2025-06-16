
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  time: string;
  price: number;
  timestamp: number;
}

const BitcoinChart = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch real Bitcoin price data from CoinGecko API
  const fetchRealBitcoinData = async () => {
    try {
      // Fetch current price
      const currentResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const currentData = await currentResponse.json();
      
      // Fetch 24-hour price history
      const historyResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly');
      const historyData = await historyResponse.json();
      
      const prices = historyData.prices || [];
      const formattedData: PriceData[] = prices.map(([timestamp, price]: [number, number]) => ({
        time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: Math.round(price),
        timestamp
      }));

      setPriceData(formattedData);
      
      const latestPrice = currentData.bitcoin.usd;
      setCurrentPrice(latestPrice);
      
      // Calculate 24h change
      const change24h = currentData.bitcoin.usd_24h_change || 0;
      const changeAmount = (latestPrice * change24h) / 100;
      setPriceChange(changeAmount);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data load
    fetchRealBitcoinData();

    // Update data every 5 minutes
    const interval = setInterval(() => {
      fetchRealBitcoinData();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const chartConfig = {
    price: {
      label: "Price (USD)",
      color: "#10b981",
    },
  };

  if (loading) {
    return (
      <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Bitcoin Live Chart</CardTitle>
          <CardDescription className="text-green-300">Loading real price data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-green-400">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Bitcoin Live Chart</span>
          <div className="flex items-center space-x-2">
            {priceChange >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}${Math.abs(priceChange).toFixed(2)}
            </span>
          </div>
        </CardTitle>
        <CardDescription className="text-green-300">
          <span className="text-2xl font-bold text-white">${currentPrice.toLocaleString()}</span>
          <span className="ml-2">Last 24 hours</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <XAxis 
                dataKey="time" 
                stroke="#10b981"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#10b981"
                fontSize={12}
                tickLine={false}
                domain={['dataMin - 1000', 'dataMax + 1000']}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "Price"]}
                />} 
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 text-xs text-green-400 text-center">
          * Real Bitcoin price data from CoinGecko API
        </div>
      </CardContent>
    </Card>
  );
};

export default BitcoinChart;
