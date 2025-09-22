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

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, currentSession) => {
      console.log("Auth event:", event, currentSession);
      setSession(currentSession);

      if (currentSession) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, role")
          .eq("id", currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setUser(currentSession.user as (User & UserProfile));
        } else {
          console.log("Profile data:", profileData);
          setUser({ ...currentSession.user, ...profileData } as User & UserProfile);
        }
      } else {
        console.log("No session, setUser(null)");
        setUser(null);
      }
      setLoading(false);
    }
  );

  // Initial session check
  supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
    console.log("Initial session:", initialSession, error);
    setSession(initialSession);
    if (initialSession) {
      supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", initialSession.user.id)
        .single()
        .then(({ data: profileData, error: profileError }) => {
          if (profileError) {
            console.error("Error fetching initial profile:", profileError);
            setUser(initialSession.user as (User & UserProfile));
          } else {
            console.log("Initial profile data:", profileData);
            setUser({ ...initialSession.user, ...profileData } as User & UserProfile);
          }
        });
    }
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);



  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
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