'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../lib/types';
import * as api from '../lib/auth-api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = api.getAccessToken();
    if (token) {
      api.getCurrentUser()
        .then((response) => setUser(response.data ?? null))
        .catch(() => {
          api.clearTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await api.login({ identifier, password });
    api.saveTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      api.clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
