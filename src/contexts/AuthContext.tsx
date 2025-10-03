import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface AuthContextType {
  session: Session | null;
  user: (User & UserProfile) | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(User & UserProfile) | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, role")
          .eq("id", userId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    };

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (!isMounted) return;

        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          
          if (!isMounted) return;
          
          setSession(currentSession);
          setUser({ 
            ...currentSession.user, 
            ...profile 
          } as User & UserProfile);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth event:", event);

        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          
          if (!isMounted) return;
          
          setSession(currentSession);
          setUser({ 
            ...currentSession.user, 
            ...profile 
          } as User & UserProfile);
          setLoading(false);
        }

        if (event === 'TOKEN_REFRESHED' && currentSession) {
          // Just update session, don't refetch profile
          if (isMounted) {
            setSession(currentSession);
          }
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Logging out...');
      
      // Clear state first
      setSession(null);
      setUser(null);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even on error
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};