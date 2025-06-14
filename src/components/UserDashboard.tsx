
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalRequest {
  id: string;
  amount: number;
  btc_address: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

const UserDashboard = () => {
  const { user, signOut } = useAuth();
  const [balance, setBalance] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  const { toast } = useToast();

  // Demo BTC address for deposits
  const depositAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  useEffect(() => {
    if (user) {
      loadUserBalance();
      loadUserWithdrawals();
    }
  }, [user]);

  const loadUserBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBalance(Number(data.balance) || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadUserWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the status to the correct type
      const typedData = (data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected'
      }));
      setUserWithdrawals(typedData);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Bitcoin address copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!withdrawalAmount || !withdrawalAddress) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Error",
        description: "Insufficient balance for withdrawal.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user?.id,
          amount: amount,
          btc_address: withdrawalAddress,
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for admin approval.",
      });

      // Clear form and reload data
      setWithdrawalAmount("");
      setWithdrawalAddress("");
      loadUserWithdrawals();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600';
      case 'approved':
        return 'bg-green-600';
      case 'rejected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const username = user?.user_metadata?.username || user?.email || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjk1MDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">₿</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome, {username}</h1>
              <p className="text-gray-300">Manage your Bitcoin portfolio</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Logout
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-400 mb-2">
              {balance.toFixed(8)} BTC
            </div>
            <p className="text-gray-300">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="deposit" className="text-gray-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-gray-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Withdraw
            </TabsTrigger>
            <TabsTrigger value="history" className="text-gray-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Deposit Bitcoin</CardTitle>
                <CardDescription className="text-gray-300">
                  Send Bitcoin to the address below to add funds to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <Label className="text-gray-200 text-sm font-medium">Your Bitcoin Deposit Address</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <code className="flex-1 bg-gray-900 p-3 rounded text-orange-400 font-mono text-sm break-all">
                      {depositAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(depositAddress)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    <strong>Important:</strong> Only send Bitcoin (BTC) to this address. 
                    Deposits are processed manually by our admin team. Please allow time for confirmation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Withdraw Bitcoin</CardTitle>
                <CardDescription className="text-gray-300">
                  Request a withdrawal to your Bitcoin address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount" className="text-gray-200">Amount (BTC)</Label>
                  <Input
                    id="withdrawal-amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    Available: {balance.toFixed(8)} BTC
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-address" className="text-gray-200">Bitcoin Address</Label>
                  <Input
                    id="withdrawal-address"
                    placeholder="Enter your Bitcoin address"
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <Button 
                  onClick={handleWithdrawal}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!withdrawalAmount || !withdrawalAddress || parseFloat(withdrawalAmount || "0") > balance}
                >
                  Submit Withdrawal Request
                </Button>
                
                <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                  <p className="text-blue-200 text-sm">
                    <strong>Note:</strong> Withdrawal requests require manual approval from our admin team. 
                    You will be notified once your request is processed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Withdrawal History</CardTitle>
                <CardDescription className="text-gray-300">
                  Track your withdrawal requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userWithdrawals.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No withdrawal requests yet</p>
                ) : (
                  <div className="space-y-4">
                    {userWithdrawals.map((request) => (
                      <div key={request.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-semibold">{Number(request.amount).toFixed(8)} BTC</p>
                            <p className="text-gray-300 text-sm">{new Date(request.created_at).toLocaleString()}</p>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} text-white capitalize`}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-xs break-all">
                          To: {request.btc_address}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
