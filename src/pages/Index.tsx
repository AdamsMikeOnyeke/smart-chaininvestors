
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/AdminDashboard";
import UserDashboard from "@/components/UserDashboard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'user' | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (type: 'admin' | 'user') => {
    // Simple authentication for demo purposes
    if (type === 'admin' && username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setUserType('admin');
      toast({
        title: "Welcome Admin",
        description: "You have successfully logged in to the admin dashboard.",
      });
    } else if (type === 'user' && username && password) {
      setIsAuthenticated(true);
      setUserType('user');
      toast({
        title: "Welcome User",
        description: "You have successfully logged in to your dashboard.",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. For admin use: admin/admin123",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setUsername("");
    setPassword("");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (isAuthenticated && userType) {
    return userType === 'admin' ? 
      <AdminDashboard onLogout={handleLogout} /> : 
      <UserDashboard username={username} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjk1MDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-gray-800/90 border-gray-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">₿</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">CryptoBroker</CardTitle>
          <CardDescription className="text-gray-300">
            Secure Bitcoin Trading Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="user" className="text-gray-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                User Login
              </TabsTrigger>
              <TabsTrigger value="admin" className="text-gray-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Admin Login
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="user" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="user-username" className="text-gray-200">Username</Label>
                <Input
                  id="user-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password" className="text-gray-200">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={() => handleLogin('user')} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Login as User
              </Button>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="admin-username" className="text-gray-200">Admin Username</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-gray-200">Admin Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={() => handleLogin('admin')} 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Login as Admin
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Demo credentials: admin / admin123
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
