
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Copy, Wallet, ArrowUpRight, ArrowDownLeft, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import BitcoinChart from "./BitcoinChart";

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
  const [showQR, setShowQR] = useState(false);
  const [btcPrice, setBtcPrice] = useState(0);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const { toast } = useToast();

  // Updated BTC address for deposits
  const depositAddress = "bc1qmz4qffv2um3y5uhwxnt40dqs2qa6x9j6vy9m04";

  useEffect(() => {
    if (user) {
      console.log('User logged in, loading dashboard data for:', user.email);
      loadUserBalance();
      loadUserWithdrawals();
      fetchBitcoinPrice();
    }
  }, [user]);

  const fetchBitcoinPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (response.ok) {
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
      }
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
    }
  };

  const loadUserBalance = async () => {
    try {
      console.log('Loading user balance...');
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading balance:', error);
        // Don't throw error, just log it - user might not have a balance record yet
        return;
      }
      
      const balanceValue = Number(data?.balance) || 0;
      console.log('User balance loaded:', balanceValue);
      setBalance(balanceValue);
    } catch (error) {
      console.error('Exception loading balance:', error);
    }
  };

  const loadUserWithdrawals = async () => {
    try {
      console.log('Loading user withdrawals...');
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading withdrawals:', error);
        return;
      }
      
      // Cast the status to the correct type
      const typedData = (data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected'
      }));
      console.log('User withdrawals loaded:', typedData.length);
      setUserWithdrawals(typedData);
    } catch (error) {
      console.error('Exception loading withdrawals:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
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
    if (isSubmittingWithdrawal) return; // Prevent multiple submissions

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

    setIsSubmittingWithdrawal(true);

    try {
      console.log('Submitting withdrawal request...');
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
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleSignOut = async () => {
    console.log('User clicked sign out');
    await signOut();
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

  // Calculate USD equivalents
  const balanceUSD = balance * btcPrice;
  const withdrawalAmountNum = parseFloat(withdrawalAmount) || 0;
  const withdrawalUSD = withdrawalAmountNum * btcPrice;

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGIxMDQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <img src="\file_0000000057986246b56fe43d4c305351.png" alt="logo" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">Welcome, {username}</h1>
              <p className="text-green-300 text-sm sm:text-base">Manage your Bitcoin portfolio</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            className="border-green-600 text-green-300 hover:bg-green-800 flex items-center gap-2 px-3 sm:px-4 py-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Bitcoin Chart Section */}
        <div className="mb-6 sm:mb-8">
          <BitcoinChart />
        </div>

        {/* User ID Card */}
        <Card className="bg-black/90 border-green-700 backdrop-blur-sm mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Your User ID
            </CardTitle>
            <CardDescription className="text-green-300 text-sm">
              Share this ID with the admin when making deposits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-green-600">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <code className="flex-1 bg-black p-2 sm:p-3 rounded text-green-400 font-mono text-xs sm:text-sm break-all overflow-hidden">
                  {user?.id}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(user?.id || "")}
                  className="border-green-600 text-green-300 hover:bg-green-800 shrink-0 w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="bg-black/90 border-green-700 backdrop-blur-sm mb-6 sm:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-4xl font-bold text-green-400 mb-2 break-words">
              {balance.toFixed(8)} BTC
            </div>
            {btcPrice > 0 && (
              <div className="text-lg sm:text-xl font-semibold text-white mb-2">
                ≈ ${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
            )}
            <p className="text-green-300 text-sm sm:text-base">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="bg-black border-green-700 w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="deposit" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black text-xs sm:text-sm">
              <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Deposit</span>
              <span className="sm:hidden">Dep.</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black text-xs sm:text-sm">
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Withdraw</span>
              <span className="sm:hidden">With.</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-black text-xs sm:text-sm">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 mt-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg sm:text-xl">Deposit Bitcoin</CardTitle>
                <CardDescription className="text-green-300 text-sm">
                  Send Bitcoin to the address below, then email the admin with your User ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Section */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg">
                    <QRCodeSVG 
                      value={depositAddress} 
                      size={150}
                      level="M"
                      className="sm:w-[200px] sm:h-[200px]"
                    />
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-green-600">
                  <Label className="text-green-200 text-sm font-medium">Your Bitcoin Deposit Address</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                    <code className="flex-1 bg-black p-2 sm:p-3 rounded text-green-400 font-mono text-xs sm:text-sm break-all overflow-hidden">
                      {depositAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(depositAddress)}
                      className="border-green-600 text-green-300 hover:bg-green-800 shrink-0 w-full sm:w-auto"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Admin Email Section */}
                <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-green-600">
                  <Label className="text-green-200 text-sm font-medium">Admin Email for Deposits</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                    <code className="flex-1 bg-black p-2 sm:p-3 rounded text-green-400 font-mono text-xs sm:text-sm break-all overflow-hidden">
                      Smartchaininvestors@gmail.com
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("Smartchaininvestors@gmail.com")}
                      className="border-green-600 text-green-300 hover:bg-green-800 shrink-0 w-full sm:w-auto"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 sm:p-4">
                  <p className="text-blue-200 text-sm font-medium">
                    <strong>Deposit Process:</strong>
                  </p>
                  <ol className="text-blue-200 text-sm mt-2 list-decimal list-inside space-y-1">
                    <li>Scan the QR code above or copy the Bitcoin address</li>
                    <li>Send Bitcoin to this address from your wallet</li>
                    <li>Copy your User ID from the card above</li>
                    <li>Email <strong>Smartchaininvestors@gmail.com</strong> with your User ID and deposit details</li>
                    <li>Wait for admin confirmation and balance update</li>
                  </ol>
                </div>
                
                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3 sm:p-4">
                  <p className="text-yellow-200 text-sm">
                    <strong>Important:</strong> Only send Bitcoin (BTC) to this address. 
                    Always include your User ID when contacting the admin about deposits.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 mt-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg sm:text-xl">Withdraw Bitcoin</CardTitle>
                <CardDescription className="text-green-300 text-sm">
                  Request a withdrawal to your Bitcoin address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount" className="text-green-200">Amount (BTC)</Label>
                  <Input
                    id="withdrawal-amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="bg-gray-900 border-green-600 text-white"
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-green-400">
                      Available: {balance.toFixed(8)} BTC
                      {btcPrice > 0 && (
                        <span className="text-green-300">
                          {" "}(${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                        </span>
                      )}
                    </p>
                    {withdrawalAmount && btcPrice > 0 && withdrawalAmountNum > 0 && (
                      <p className="text-xs text-white">
                        Withdrawal equivalent: ${withdrawalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-address" className="text-green-200">Bitcoin Address</Label>
                  <Input
                    id="withdrawal-address"
                    placeholder="Enter your Bitcoin address"
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    className="bg-gray-900 border-green-600 text-white"
                  />
                </div>
                
                <Button 
                  onClick={handleWithdrawal}
                  className="w-full bg-green-600 hover:bg-green-700 text-black"
                  disabled={!withdrawalAmount || !withdrawalAddress || parseFloat(withdrawalAmount || "0") > balance || isSubmittingWithdrawal}
                >
                  {isSubmittingWithdrawal ? "Submitting..." : "Submit Withdrawal Request"}
                </Button>
                
                <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 sm:p-4">
                  <p className="text-blue-200 text-sm">
                    <strong>Note:</strong> Withdrawal requests require manual approval from our admin team. 
                    You will be notified once your request is processed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card className="bg-black/90 border-green-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg sm:text-xl">Withdrawal History</CardTitle>
                <CardDescription className="text-green-300 text-sm">
                  Track your withdrawal requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userWithdrawals.length === 0 ? (
                  <p className="text-green-400 text-center py-8">No withdrawal requests yet</p>
                ) : (
                  <ScrollArea className="h-64 sm:h-80">
                    <div className="space-y-4 pr-4">
                      {userWithdrawals.map((request) => (
                        <div key={request.id} className="p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-green-600">
                          <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                            <div>
                              <p className="text-white font-semibold text-sm sm:text-base">{Number(request.amount).toFixed(8)} BTC</p>
                              <p className="text-green-300 text-xs sm:text-sm">{new Date(request.created_at).toLocaleString()}</p>
                            </div>
                            <Badge className={`${getStatusColor(request.status)} text-white capitalize text-xs`}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-green-400 text-xs break-all">
                            To: {request.btc_address}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
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
