import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  time: string;
  price: number;
}

const BitcoinChart = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Generate mock Bitcoin price data with realistic fluctuations
  const generateMockData = () => {
    const now = new Date();
    const data: PriceData[] = [];
    let basePrice = 45000 + Math.random() * 20000; // Random starting price between 45k-65k
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const fluctuation = (Math.random() - 0.5) * 2000; // ±$1000 fluctuation
      basePrice += fluctuation;
      basePrice = Math.max(30000, Math.min(80000, basePrice)); // Keep within realistic bounds
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: Math.round(basePrice)
      });
    }
    
    return data;
  };

  useEffect(() => {
    // Initial data load
    const initialData = generateMockData();
    setPriceData(initialData);
    setCurrentPrice(initialData[initialData.length - 1].price);
    
    if (initialData.length >= 2) {
      const change = initialData[initialData.length - 1].price - initialData[initialData.length - 2].price;
      setPriceChange(change);
    }
    
    setLoading(false);

    // Update data every 30 seconds with new price point
    const interval = setInterval(() => {
      setPriceData(prevData => {
        const lastPrice = prevData[prevData.length - 1].price;
        const fluctuation = (Math.random() - 0.5) * 1500; // ±$750 fluctuation
        const newPrice = Math.max(30000, Math.min(80000, lastPrice + fluctuation));
        const now = new Date();
        
        const newDataPoint = {
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          price: Math.round(newPrice)
        };
        
        // Keep only last 24 data points (24 hours)
        const updatedData = [...prevData.slice(1), newDataPoint];
        
        setCurrentPrice(newPrice);
        setPriceChange(newPrice - lastPrice);
        
        return updatedData;
      });
    }, 30000); // Update every 30 seconds

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
          <CardDescription className="text-green-300">Loading price data...</CardDescription>
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
              {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}
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
          * Simulated data for demonstration purposes
        </div>
      </CardContent>
    </Card>
  );
};

export default BitcoinChart;
