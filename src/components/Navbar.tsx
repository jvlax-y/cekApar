import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.email;

  return (
    <nav className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold hover:opacity-90 transition-opacity">
          Satpam App
        </Link>
        <div className="flex items-center space-x-4">
          <span className="text-sm md:text-base">
            {displayName} ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})
          </span>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 border border-white/30 transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;