"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // TODO: Replace with actual Supabase auth
      // This is just a mock for now
      const mockUsers = [
        { email: 'admin@satpam.com', password: 'admin123', role: 'admin' },
        { email: 'satpam@satpam.com', password: 'satpam123', role: 'satpam' },
        { email: 'supervisor@satpam.com', password: 'supervisor123', role: 'supervisor' },
      ];
      
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        localStorage.setItem('user', JSON.stringify({ email, role: user.role }));
        switch(user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'satpam':
            navigate('/satpam');
            break;
          case 'supervisor':
            navigate('/supervisor');
            break;
          default:
            navigate('/');
        }
      } else {
        setError('Email atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Satpam App</CardTitle>
          <CardDescription>Manajemen Pengecekan APAR</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;