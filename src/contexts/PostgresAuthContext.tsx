import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  error: string | null;
  clearError: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use the API URL from environment or fall back to relative path
const API_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'replay-auth-token';
const USER_KEY = 'replay-user';

console.log('PostgresAuthContext - API URL:', API_URL);

export const PostgresAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user and token on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser({
            ...parsedUser,
            createdAt: new Date(parsedUser.createdAt)
          });

          // Verify token is still valid
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (!response.ok) {
            // Token is invalid, clear auth
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error("Failed to load auth:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null);

    if (!email || !password || !name) {
      setError("All fields are required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          username: name.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return false;
      }

      // Save token and user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setToken(data.token);
      setUser({
        ...data.user,
        createdAt: new Date(data.user.created_at)
      });

      return true;
    } catch (e) {
      console.error('Auth error:', e);
      setError('Network error. Please check your connection and try again.');
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign in');
        return false;
      }

      // Save token and user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setToken(data.token);
      setUser({
        ...data.user,
        createdAt: new Date(data.user.created_at)
      });

      return true;
    } catch (e) {
      console.error('Auth error:', e);
      setError('Network error. Please check your connection and try again.');
      return false;
    }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      signUp,
      signIn,
      signOut,
      error,
      clearError,
      token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};