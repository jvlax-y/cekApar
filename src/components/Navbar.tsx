"use client";

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'satpam':
        return 'bg-green-500 text-white';
      case 'supervisor':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold">Satpam App</div>
        <div className="flex items-center space-x-4">
          {user?.email && (
            <>
              <span className="flex items-center">
                <span className="mr-2">{user.email}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </span>
              <Button 
                variant="outline" 
                className="text-white border-white hover:bg-gray-700"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;