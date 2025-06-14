
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalRequest {
  id: string;
  amount: number;
  btc_address: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles: {
    username: string;
  };
}

interface UserBalance {
  user_id: string;
  balance: number;
  profiles: {
    username: string;
  };
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawalRequests();
    loadUserBalances();
  }, []);

  const loadWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the status to the correct type
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
          profiles (username)
        `);

      if (error) throw error;
      setUserBalances(data || []);
    } catch (error) {
      console.error('Error loading user balances:', error);
    }
  };

  const handleWithdrawalAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        // Find the withdrawal request
        const request = withdrawalRequests.find(req => req.id === requestId);
        if (!request) return;

        // Get current user balance
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', request.profiles.username) // Note: This might need adjustment based on actual user ID
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

        // Update user balance
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ balance: currentBalance - request.amount })
          .eq('user_id', request.profiles.username);

        if (updateError) throw updateError;
      }

      // Update withdrawal request status
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The withdrawal request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });

      // Reload data
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
      // Get current balance
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

      // Update balance
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

  const pendingRequests = withdrawalRequests.filter(req => req.status === 'pending');
  const totalUsers = userBalances.length;
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + Number(req.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNkYzI2MjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">₿</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-300">Manage withdrawals and user balances</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Total Users</CardTitle>
              <User className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Pending Requests</CardTitle>
              <Wallet className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Pending Amount</CardTitle>
              <span className="text-orange-500 font-bold">₿</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPendingAmount.toFixed(8)} BTC</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="withdrawals" className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Withdrawal Requests
            </TabsTrigger>
            <TabsTrigger value="balances" className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Manage Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Pending Withdrawal Requests</CardTitle>
                <CardDescription className="text-gray-300">
                  Review and approve/reject withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No pending withdrawal requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-orange-400 border-orange-400">
                                {request.profiles.username}
                              </Badge>
                              <Badge variant="secondary" className="bg-yellow-600 text-white">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-white font-semibold">Amount: {Number(request.amount).toFixed(8)} BTC</p>
                            <p className="text-gray-300 text-sm">To: {request.btc_address}</p>
                            <p className="text-gray-400 text-xs">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
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
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">User Balances</CardTitle>
                <CardDescription className="text-gray-300">
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
                        <Label htmlFor="user-select" className="text-gray-200">Select User</Label>
                        <select
                          id="user-select"
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-full mt-1 p-2 bg-gray-700 border-gray-600 text-white rounded-md"
                        >
                          <option value="">Select a user</option>
                          {userBalances.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.profiles.username} (Balance: {Number(user.balance).toFixed(8)} BTC)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="operation-select" className="text-gray-200">Operation</Label>
                        <select
                          id="operation-select"
                          value={operation}
                          onChange={(e) => setOperation(e.target.value as 'add' | 'subtract')}
                          className="w-full mt-1 p-2 bg-gray-700 border-gray-600 text-white rounded-md"
                        >
                          <option value="add">Add to Balance</option>
                          <option value="subtract">Subtract from Balance</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="balance-amount" className="text-gray-200">Amount (BTC)</Label>
                        <Input
                          id="balance-amount"
                          type="number"
                          step="0.00000001"
                          placeholder="0.00000000"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleBalanceUpdate}
                        className="w-full bg-red-600 hover:bg-red-700"
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
                        <div key={user.user_id} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{user.profiles.username}</span>
                            <span className="text-orange-400 font-bold">{Number(user.balance).toFixed(8)} BTC</span>
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
