import { createContext, useContext, useState, useEffect } from 'react';
import { AuthenticationControl } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = AuthenticationControl.getSession();
    if (session) setUser(session.user);
    setLoading(false);
  }, []);

  const signIn = async (email, password, role) => {
    const session = await AuthenticationControl.signIn(email, password, role);
    setUser(session.user);
    return session;
  };

  const signOut = async () => {
    await AuthenticationControl.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
