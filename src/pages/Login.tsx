import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
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
          navigate('/'); // Fallback
          break;
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Login ke Satpam App</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers for now
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(222.2 47.4% 11.2%)', // Primary color
                  brandAccent: 'hsl(217.2 91.2% 59.8%)', // Accent color
                  inputBackground: 'hsl(210 40% 96.1%)',
                  inputBorder: 'hsl(214.3 31.8% 91.4%)',
                  inputFocusBorder: 'hsl(222.2 84% 4.9%)',
                  inputText: 'hsl(222.2 84% 4.9%)',
                },
              },
              dark: {
                colors: {
                  brand: 'hsl(210 40% 98%)',
                  brandAccent: 'hsl(217.2 91.2% 59.8%)',
                  inputBackground: 'hsl(217.2 32.6% 17.5%)',
                  inputBorder: 'hsl(217.2 32.6% 17.5%)',
                  inputFocusBorder: 'hsl(212.7 26.8% 83.9%)',
                  inputText: 'hsl(210 40% 98%)',
                },
              },
            },
          }}
          theme="light" // Default to light theme
        />
      </div>
    </div>
  );
};

export default Login;