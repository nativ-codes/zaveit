import { UserType } from '@/services/users.service';
import auth from '@react-native-firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderPropsType = {
  children: React.ReactNode;
};

function AuthProvider({ children }: AuthProviderPropsType) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('[Auth Context] Firebase user authenticated:', firebaseUser);
          setUser(firebaseUser);
          setIsAuthenticated(true);
        } else {
          console.log('[Auth Context] No Firebase user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[Auth Context] Error handling user data:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;