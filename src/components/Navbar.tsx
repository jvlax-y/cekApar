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
    return null; // Don't show navbar if not logged in
  }

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.email;

  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md dark:bg-gray-900 dark:text-gray-100">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
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
            className="text-primary-foreground hover:bg-primary/80 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;