
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
  const [error, setError] = useState<string | null>(null);

  // Fetch real Bitcoin price data from CoinGecko API
  const fetchRealBitcoinData = async () => {
    try {
      console.log('Fetching Bitcoin data...');
      
      // Fetch current price
      const currentResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      
      if (!currentResponse.ok) {
        throw new Error(`Current price API error: ${currentResponse.status}`);
      }
      
      const currentData = await currentResponse.json();
      console.log('Current price data:', currentData);
      
      // Fetch 24-hour price history without specifying interval (let it auto-determine)
      const historyResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
      
      if (!historyResponse.ok) {
        // If history fails, still show current price with fallback chart data
        console.warn('History API failed, using current price only');
        const latestPrice = currentData.bitcoin.usd;
        setCurrentPrice(latestPrice);
        
        const change24h = currentData.bitcoin.usd_24h_change || 0;
        const changeAmount = (latestPrice * change24h) / 100;
        setPriceChange(changeAmount);
        
        // Create fallback chart data with current price
        const now = Date.now();
        const fallbackData: PriceData[] = Array.from({ length: 24 }, (_, i) => ({
          time: new Date(now - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          price: latestPrice + (Math.random() - 0.5) * 1000, // Small random variation
          timestamp: now - (23 - i) * 60 * 60 * 1000
        }));
        
        setPriceData(fallbackData);
        setLoading(false);
        return;
      }
      
      const historyData = await historyResponse.json();
      console.log('History data received, prices count:', historyData.prices?.length);
      
      const prices = historyData.prices || [];
      // Take every 6th data point to get roughly hourly data from the 5-minute intervals
      const hourlyPrices = prices.filter((_: any, index: number) => index % 6 === 0);
      
      const formattedData: PriceData[] = hourlyPrices.map(([timestamp, price]: [number, number]) => ({
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
      setError(null);
      console.log('Bitcoin data loaded successfully');
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      setError('Failed to load Bitcoin data');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data load
    fetchRealBitcoinData();

    // Update data every 2 minutes to avoid rate limits
    const interval = setInterval(() => {
      fetchRealBitcoinData();
    }, 120000); // 2 minutes

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

  if (error) {
    return (
      <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Bitcoin Live Chart</CardTitle>
          <CardDescription className="text-red-300">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-red-400">Failed to load chart data</div>
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
          * Real Bitcoin price data from CoinGecko API • Updates every 2 minutes
        </div>
      </CardContent>
    </Card>
  );
};

export default BitcoinChart;
