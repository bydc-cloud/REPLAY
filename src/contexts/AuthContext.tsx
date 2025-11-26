import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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
  isUsingSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys for fallback mode
const USERS_STORAGE_KEY = "replay-users";
const CURRENT_USER_KEY = "replay-current-user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingSupabase] = useState(isSupabaseConfigured());

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (isUsingSupabase) {
          // Supabase authentication
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Get user profile from database
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.username || session.user.email?.split('@')[0] || 'User',
              createdAt: new Date(session.user.created_at)
            });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.username || session.user.email?.split('@')[0] || 'User',
                createdAt: new Date(session.user.created_at)
              });
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
          });
        } else {
          // Fallback to localStorage
          const savedUser = localStorage.getItem(CURRENT_USER_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser({
              ...parsedUser,
              createdAt: new Date(parsedUser.createdAt)
            });
          }
        }
      } catch (e) {
        console.error("Failed to load user:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [isUsingSupabase]);

  // Local storage helpers for fallback mode
  const getUsers = (): Record<string, { user: User; passwordHash: string }> => {
    try {
      const users = localStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : {};
    } catch {
      return {};
    }
  };

  const saveUsers = (users: Record<string, { user: User; passwordHash: string }>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

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

    if (isUsingSupabase) {
      // Supabase signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: name.trim() }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return false;
      }

      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: name.trim(),
          email: email.toLowerCase()
        });

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: name.trim(),
          createdAt: new Date()
        });
        return true;
      }
      return false;
    } else {
      // Fallback to localStorage
      const users = getUsers();
      const emailLower = email.toLowerCase();

      if (users[emailLower]) {
        setError("An account with this email already exists");
        return false;
      }

      const passwordHash = await hashPassword(password);
      const newUser: User = {
        id: crypto.randomUUID(),
        email: emailLower,
        name: name.trim(),
        createdAt: new Date()
      };

      users[emailLower] = { user: newUser, passwordHash };
      saveUsers(users);

      setUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      return true;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    if (isUsingSupabase) {
      // Supabase signin
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return false;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.username || data.user.email?.split('@')[0] || 'User',
          createdAt: new Date(data.user.created_at)
        });
        return true;
      }
      return false;
    } else {
      // Fallback to localStorage
      const users = getUsers();
      const emailLower = email.toLowerCase();
      const userData = users[emailLower];

      if (!userData) {
        setError("No account found with this email");
        return false;
      }

      const passwordHash = await hashPassword(password);
      if (userData.passwordHash !== passwordHash) {
        setError("Incorrect password");
        return false;
      }

      const loadedUser = {
        ...userData.user,
        createdAt: new Date(userData.user.createdAt)
      };

      setUser(loadedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loadedUser));

      return true;
    }
  };

  const signOut = async () => {
    if (isUsingSupabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
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
      isUsingSupabase
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
