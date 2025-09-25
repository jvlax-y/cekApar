import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
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

  useEffect(() => {
    console.log("AuthProvider mounted...");

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      console.log("Initial session:", initialSession);
      
      if (initialSession) {
        await fetchUserProfile(initialSession);
      } else {
        setLoading(false);
      }
    };

    // Fetch user profile
    const fetchUserProfile = async (currentSession: Session) => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", currentSession.user.id)
        .single();

      setSession(currentSession);

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setUser(currentSession.user as (User & UserProfile));
      } else {
        console.log("Profile data:", profileData);
        setUser({ ...currentSession.user, ...profileData } as User & UserProfile);
      }
      setLoading(false);
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth event:", event, currentSession);
        
        if (currentSession) {
          await fetchUserProfile(currentSession);
        } else {
          console.log("No session, clearing user");
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    getInitialSession();

    // Cleanup function
    return () => {
      console.log("AuthProvider cleanup");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};