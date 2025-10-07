import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
          },
        },
      });

      if (error) throw error;

      toast.success('Pendaftaran berhasil! Silakan login.');
      navigate('/login');
    } catch (error: unknown) {
      toast.error(`Gagal mendaftar: ${error.message}`);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white rounded-t-lg">
          <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6" />
            Daftar Akun Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Depan & Belakang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Depan <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="first_name"
                  placeholder="Nama Depan"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="border-2 focus:border-[#2a5298]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Belakang <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="last_name"
                  placeholder="Nama Belakang"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="border-2 focus:border-[#2a5298]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="border-2 focus:border-[#2a5298]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="border-2 focus:border-[#2a5298] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2a5298]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298] hover:from-[#2a5298] hover:to-[#1e3c72] text-white font-bold py-3"
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </form>

          {/* Link to Login */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#2a5298] font-semibold hover:underline"
            >
              Masuk di sini
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Info:</strong> Setelah mendaftar, akun Anda akan otomatis mendapat role "Satpam (user)". 
              Hubungi admin untuk mengubah role jika diperlukan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;