
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "@/components/AdminDashboard";
import UserDashboard from "@/components/UserDashboard";
import AuthPage from "@/components/AuthPage";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, we show the dashboard based on their role
    // The auth page is now at /auth route, so unauthenticated users should be here
  }, [user, navigate]);

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
