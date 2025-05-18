
"use client";

import type { User } from '@/lib/types'; // Assuming User type might be defined or extended later
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (email: string) => void; // Simplified login
  logout: () => void;
  signup: (email: string) => void; // Simplified signup
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock current user type
interface User {
  email: string;
  name?: string; // Optional name
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Used to check auth status on load
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth status from localStorage or an API
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string) => {
    const mockUser: User = { email, name: email.split('@')[0] };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    setUser(mockUser);
    router.push('/dashboard'); // Redirect after login
  }, [router]);

  const signup = useCallback((email: string) => {
    // In a real app, this would involve an API call
    const mockUser: User = { email, name: email.split('@')[0] };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    setUser(mockUser);
    router.push('/dashboard'); // Redirect after signup
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login'); // Redirect after logout
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
