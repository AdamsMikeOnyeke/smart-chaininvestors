
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import UserDashboard from "@/components/UserDashboard";
import AuthPage from "@/components/AuthPage";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Check if user is admin based on username from metadata
  const isAdmin = user.user_metadata?.username === 'admin';

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

export default Index;
