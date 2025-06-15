
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WithdrawalRequest {
  id: string;
  amount: number;
  btc_address: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  profiles: {
    username: string;
    email: string;
  } | null;
}

interface UserBalance {
  user_id: string;
  balance: number;
  profiles: {
    username: string;
    email: string;
  } | null;
}

interface BitcoinPrice {
  usd: number;
}

interface PriceHistory {
  timestamp: number;
  price: number;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawalRequests();
    loadUserBalances();
    fetchBtcPrice();
    fetchPriceHistory();
  }, []);

  const fetchBtcPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      setBtcPrice(data.bitcoin.usd);
    } catch (error) {
      console.error('Error fetching BTC price:', error);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily');
      const data = await response.json();
      const history = data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price: Math.round(price)
      }));
      setPriceHistory(history);
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles!withdrawal_requests_user_id_fkey (username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Withdrawal requests data:', data);
      const typedData = (data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected'
      }));
      setWithdrawalRequests(typedData);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    }
  };

  const loadUserBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select(`
          *,
          profiles!user_balances_user_id_fkey (username, email)
        `);

      if (error) throw error;
      console.log('User balances data:', data);
      setUserBalances(data || []);
    } catch (error) {
      console.error('Error loading user balances:', error);
    }
  };

  const getUserDisplayName = (user: UserBalance | WithdrawalRequest) => {
    if (user.profiles?.email) {
      return user.profiles.email;
    }
    // Fallback: try to get email from auth.users table
    return `User ID: ${user.user_id.substring(0, 8)}...`;
  };

  const handleWithdrawalAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const request = withdrawalRequests.find(req => req.id === requestId);
        if (!request) return;

        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', request.user_id)
          .single();

        if (balanceError) throw balanceError;

        const currentBalance = Number(balanceData.balance);
        if (currentBalance < request.amount) {
          toast({
            title: "Error",
            description: "User has insufficient balance for this withdrawal.",
            variant: "destructive",
          });
          return;
        }

        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ balance: currentBalance - request.amount })
          .eq('user_id', request.user_id);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The withdrawal request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });

      loadWithdrawalRequests();
      loadUserBalances();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process withdrawal request.",
        variant: "destructive",
      });
    }
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) {
      toast({
        title: "Error",
        description: "Please select a user and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', selectedUser)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = Number(currentData.balance);
      const newBalance = operation === 'add' 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount);

      const { error } = await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('user_id', selectedUser);

      if (error) throw error;

      toast({
        title: "Balance Updated",
        description: `Successfully ${operation === 'add' ? 'added' : 'subtracted'} ${amount} BTC ${operation === 'add' ? 'to' : 'from'} the user's balance.`,
      });

      setBalanceAmount("");
      loadUserBalances();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update balance.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatUsdValue = (btcAmount: number) => {
    return (btcAmount * btcPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const pendingRequests = withdrawalRequests.filter(req => req.status === 'pending');
  const totalUsers = userBalances.length;
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + Number(req.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGIxMDQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-black font-bold">₿</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-green-300">Manage withdrawals and user balances</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-green-400 text-sm">BTC/USD</p>
              <p className="text-white text-xl font-bold">${btcPrice.toLocaleString()}</p>
            </div>
            <Button onClick={signOut} variant="outline" className="border-green-600 text-green-300 hover:bg-green-800">
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Total Users</CardTitle>
              <User className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Pending Requests</CardTitle>
              <Wallet className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Pending Amount</CardTitle>
              <span className="text-green-500 font-bold">₿</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPendingAmount.toFixed(8)} BTC</div>
              <p className="text-green-400 text-sm">{formatUsdValue(totalPendingAmount)}</p>
            </CardContent>
          </Card>

          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">BTC Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${btcPrice.toLocaleString()}</div>
              <p className="text-green-400 text-sm">Live price</p>
            </CardContent>
          </Card>
        </div>

        {/* BTC Price Chart */}
        <Card className="bg-black/90 border-green-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">BTC/USD Price Chart (7 Days)</CardTitle>
            <CardDescription className="text-green-300">
              Bitcoin price trend over the last week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#065f46" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatDate}
                    stroke="#10b981"
                  />
                  <YAxis stroke="#10b981" />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(Number(value))}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                    contentStyle={{ 
                      backgroundColor: '#000', 
                      border: '1px solid #10b981',
                      color: '#fff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="bg-black border-green-700">
            <TabsTrigger value="withdrawals" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black">
              Withdrawal Requests
            </TabsTrigger>
            <TabsTrigger value="balances" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black">
              Manage Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Pending Withdrawal Requests</CardTitle>
                <CardDescription className="text-green-300">
                  Review and approve/reject withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-green-400 text-center py-8">No pending withdrawal requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-gray-900/50 rounded-lg border border-green-700">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {getUserDisplayName(request)}
                              </Badge>
                              <Badge variant="secondary" className="bg-yellow-600 text-white">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-white font-semibold">Amount: {Number(request.amount).toFixed(8)} BTC</p>
                            <p className="text-green-400 text-sm">≈ {formatUsdValue(Number(request.amount))}</p>
                            <p className="text-green-300 text-sm">To: {request.btc_address}</p>
                            <p className="text-green-400 text-xs">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-black"
                              onClick={() => handleWithdrawalAction(request.id, 'approve')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawalAction(request.id, 'reject')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">User Balances</CardTitle>
                <CardDescription className="text-green-300">
                  View and manage user BTC balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Balance Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Update Balance</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="user-select" className="text-green-200">Select User</Label>
                        <select
                          id="user-select"
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-full mt-1 p-2 bg-gray-900 border border-green-600 text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select a user</option>
                          {userBalances.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                              {getUserDisplayName(user)} (Balance: {Number(user.balance).toFixed(8)} BTC)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="operation-select" className="text-green-200">Operation</Label>
                        <select
                          id="operation-select"
                          value={operation}
                          onChange={(e) => setOperation(e.target.value as 'add' | 'subtract')}
                          className="w-full mt-1 p-2 bg-gray-900 border border-green-600 text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="add">Add to Balance</option>
                          <option value="subtract">Subtract from Balance</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="balance-amount" className="text-green-200">Amount (BTC)</Label>
                        <Input
                          id="balance-amount"
                          type="number"
                          step="0.00000001"
                          placeholder="0.00000000"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="bg-gray-900 border-green-600 text-white placeholder-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleBalanceUpdate}
                        className="w-full bg-green-600 hover:bg-green-700 text-black"
                      >
                        Update Balance
                      </Button>
                    </div>
                  </div>

                  {/* User List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">All Users</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {userBalances.map((user) => (
                        <div key={user.user_id} className="p-3 bg-gray-900/50 rounded-lg border border-green-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-white font-medium block">{getUserDisplayName(user)}</span>
                              <span className="text-green-400 text-sm">{user.profiles?.username || 'No username'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-green-400 font-bold block">{Number(user.balance).toFixed(8)} BTC</span>
                              <span className="text-green-300 text-sm">{formatUsdValue(Number(user.balance))}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
