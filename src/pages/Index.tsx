import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else {
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'user': // Satpam
            navigate('/satpam/dashboard');
            break;
          case 'supervisor':
            navigate('/supervisor/dashboard');
            break;
          default:
            // Fallback for unknown roles or if no specific dashboard is defined
            console.warn('Unknown user role or no specific dashboard:', user.role);
            // Optionally, show a generic welcome or redirect to a default authenticated page
            break;
        }
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        Loading application...
      </div>
    );
  }

  // This component should ideally not be reached if redirection works,
  // but serves as a fallback or initial loading state.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Satpam App</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Redirecting you to the appropriate dashboard...
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;