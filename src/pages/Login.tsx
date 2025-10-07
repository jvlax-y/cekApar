import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (!user.role) {
        toast.error('Akun Anda belum diaktifkan. Hubungi administrator.');
        return;
      }

      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'user':
          navigate('/satpam/dashboard');
          break;
        case 'supervisor':
          navigate('/supervisor/dashboard');
          break;
        default:
          toast.error('Role tidak dikenali. Hubungi administrator.');
          break;
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Satpam App</h1>
            <p className="text-gray-600">Masuk ke sistem manajemen satpam</p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(37, 99, 235)',
                    brandAccent: 'rgb(29, 78, 216)',
                    inputBackground: 'white',
                    inputBorder: 'rgb(229, 231, 235)',
                    inputBorderFocus: 'rgb(37, 99, 235)',
                    inputText: 'rgb(17, 24, 39)',
                  },
                },
              },
              className: {
                button: 'rounded-lg font-semibold',
                input: 'rounded-lg',
              },
            }}
            view="sign_in"  // ✅ Cuma tampil form login
            showLinks={false}  // ✅ Sembunyiin link "Don't have account?"
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  button_label: 'Masuk',
                  loading_button_label: 'Memproses...',
                },
              },
            }}
          />

          {/* Manual link ke /register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Daftar di sini
              </button>
            </p>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          Setelah mendaftar, hubungi administrator untuk aktivasi akun.
        </p>
      </div>
    </div>
  );
};

export default Login;