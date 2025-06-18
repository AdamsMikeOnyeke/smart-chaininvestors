import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User, Wallet, TrendingUp, Copy, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BitcoinChart from "./BitcoinChart";

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

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawalRequests();
    loadUserBalances();
    fetchBtcPrice();
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
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('User balances data:', data);
      setUserBalances(data || []);
    } catch (error) {
      console.error('Error loading user balances:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "User ID copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = (user: UserBalance | WithdrawalRequest) => {
    if (user.profiles?.email) {
      return user.profiles.email;
    }
    return `User ID: ${user.user_id.slice(0, 8)}...`;
  };

  const getSelectedUserDisplayName = () => {
    const user = userBalances.find(u => u.user_id === selectedUser);
    return user ? getUserDisplayName(user) : '';
  };

  const getSelectedUser = () => {
    return userBalances.find(u => u.user_id === selectedUser);
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

      const userDisplayName = getSelectedUserDisplayName();
      toast({
        title: "Balance Updated",
        description: `Successfully ${operation === 'add' ? 'added' : 'subtracted'} ${amount} BTC ${operation === 'add' ? 'to' : 'from'} ${userDisplayName}'s balance.`,
      });

      setBalanceAmount("");
      setSelectedUser("");
      loadUserBalances();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update balance.",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGIxMDQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <img src="\file_0000000057986246b56fe43d4c305351.png" alt="logo" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-green-300 text-sm sm:text-base">Manage withdrawals and user balances</p>
            </div>
          </div>
          <Button 
            onClick={signOut} 
            variant="outline" 
            className="border-green-600 text-green-300 hover:bg-green-800 flex items-center gap-2 px-3 sm:px-4 py-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-200">Total Users</CardTitle>
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-200">Pending Requests</CardTitle>
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-white">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-200">Pending Amount</CardTitle>
              <span className="text-green-500 font-bold text-sm">₿</span>
            </CardHeader>
            <CardContent>
              <div className="text-sm sm:text-2xl font-bold text-white">{totalPendingAmount.toFixed(8)} BTC</div>
              <p className="text-green-400 text-xs sm:text-sm">{formatUsdValue(totalPendingAmount)}</p>
            </CardContent>
          </Card>

          <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-200">BTC Price</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm sm:text-2xl font-bold text-white">${btcPrice.toLocaleString()}</div>
              <p className="text-green-400 text-xs sm:text-sm">Live price</p>
            </CardContent>
          </Card>
        </div>

        {/* Bitcoin Chart Section */}
        <div className="mb-6 sm:mb-8">
          <BitcoinChart />
        </div>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="bg-black border-green-700 w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="withdrawals" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black text-xs sm:text-sm">
              <span className="hidden sm:inline">Withdrawal Requests</span>
              <span className="sm:hidden">Withdrawals</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black text-xs sm:text-sm">
              <span className="hidden sm:inline">Manage Balances</span>
              <span className="sm:hidden">Balances</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4 mt-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg sm:text-xl">Pending Withdrawal Requests</CardTitle>
                <CardDescription className="text-green-300 text-sm">
                  Review and approve/reject withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-green-400 text-center py-8">No pending withdrawal requests</p>
                ) : (
                  <ScrollArea className="h-96 sm:h-[500px]">
                    <div className="space-y-4 pr-4">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-green-700">
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                            <div className="space-y-3 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                                  {getUserDisplayName(request)}
                                </Badge>
                                <Badge variant="secondary" className="bg-yellow-600 text-white text-xs">
                                  Pending
                                </Badge>
                              </div>
                              
                              {/* User ID with copy button */}
                              <div className="bg-gray-800/50 p-2 sm:p-3 rounded border border-green-600">
                                <Label className="text-green-200 text-xs font-medium block mb-2">User ID</Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  <code className="flex-1 bg-black p-2 rounded text-green-400 font-mono text-xs break-all overflow-hidden">
                                    {request.user_id}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(request.user_id)}
                                    className="border-green-600 text-green-300 hover:bg-green-800 shrink-0 w-full sm:w-auto"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-white font-semibold text-sm sm:text-base">Amount: {Number(request.amount).toFixed(8)} BTC</p>
                                  <p className="text-green-400 text-xs sm:text-sm">≈ {formatUsdValue(Number(request.amount))}</p>
                                </div>
                                <div>
                                  <p className="text-green-400 text-xs">
                                    Requested: {new Date(request.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-green-200 text-xs font-medium">Bitcoin Address:</p>
                                <p className="text-green-300 text-xs sm:text-sm break-all bg-gray-800/30 p-2 rounded">{request.btc_address}</p>
                              </div>
                            </div>
                            <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 w-full lg:w-auto">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-black flex-1 lg:flex-none text-xs sm:text-sm"
                                onClick={() => handleWithdrawalAction(request.id, 'approve')}
                              >
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleWithdrawalAction(request.id, 'reject')}
                                className="flex-1 lg:flex-none text-xs sm:text-sm"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4 mt-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg sm:text-xl">User Balances</CardTitle>
                <CardDescription className="text-green-300 text-sm">
                  View and manage user BTC balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Balance Management */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Update Balance</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="user-select" className="text-green-200 text-sm">Select User</Label>
                        <select
                          id="user-select"
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-full mt-1 p-2 bg-gray-900 border border-green-600 text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        >
                          <option value="">Select a user</option>
                          {userBalances.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                              {getUserDisplayName(user)} (Balance: {Number(user.balance).toFixed(8)} BTC)
                            </option>
                          ))}
                        </select>
                        {userBalances.length === 0 && (
                          <p className="text-yellow-400 text-sm mt-1">No users found</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="operation-select" className="text-green-200 text-sm">Operation</Label>
                        <select
                          id="operation-select"
                          value={operation}
                          onChange={(e) => setOperation(e.target.value as 'add' | 'subtract')}
                          className="w-full mt-1 p-2 bg-gray-900 border border-green-600 text-white rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        >
                          <option value="add">Add to Balance</option>
                          <option value="subtract">Subtract from Balance</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="balance-amount" className="text-green-200 text-sm">Amount (BTC)</Label>
                        <Input
                          id="balance-amount"
                          type="number"
                          step="0.00000001"
                          placeholder="0.00000000"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="bg-gray-900 border-green-600 text-white placeholder-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                      </div>
                      
                      {selectedUser && getSelectedUser() && (
                        <div className="p-3 sm:p-4 bg-green-900/20 border border-green-600 rounded-md space-y-3">
                          <div>
                            <p className="text-green-200 text-sm font-medium">Selected user:</p>
                            <p className="text-white font-medium text-sm">{getSelectedUserDisplayName()}</p>
                          </div>
                          
                          {/* Full User ID display */}
                          <div className="bg-gray-800/50 p-2 sm:p-3 rounded border border-green-600">
                            <Label className="text-green-200 text-xs font-medium block mb-2">Full User ID</Label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                              <code className="flex-1 bg-black p-2 rounded text-green-400 font-mono text-xs break-all overflow-hidden">
                                {selectedUser}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(selectedUser)}
                                className="border-green-600 text-green-300 hover:bg-green-800 shrink-0 w-full sm:w-auto"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-green-300 text-sm">
                              Current Balance: {Number(getSelectedUser()?.balance || 0).toFixed(8)} BTC
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleBalanceUpdate}
                        className="w-full bg-green-600 hover:bg-green-700 text-black text-sm"
                        disabled={!selectedUser || !balanceAmount}
                      >
                        Update Balance
                      </Button>
                    </div>
                  </div>

                  {/* User List */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white">All Users</h3>
                    <ScrollArea className="h-96 sm:h-[500px]">
                      <div className="space-y-3 pr-4">
                        {userBalances.map((user) => (
                          <div key={user.user_id} className="p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-green-700">
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-white font-medium block text-sm break-words">{getUserDisplayName(user)}</span>
                                  <span className="text-green-400 text-xs">{user.profiles?.username || 'No username'}</span>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="text-green-400 font-bold block text-sm">{Number(user.balance).toFixed(8)} BTC</span>
                                  <span className="text-green-300 text-xs">{formatUsdValue(Number(user.balance))}</span>
                                </div>
                              </div>
                              
                              {/* User ID display */}
                              <div className="bg-gray-800/50 p-2 sm:p-3 rounded border border-green-600">
                                <Label className="text-green-200 text-xs font-medium block mb-2">User ID</Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  <code className="flex-1 bg-black p-2 rounded text-green-400 font-mono text-xs break-all overflow-hidden">
                                    {user.user_id}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(user.user_id)}
                                    className="border-green-600 text-green-300 hover:bg-green-800 shrink-0 w-full sm:w-auto"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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
