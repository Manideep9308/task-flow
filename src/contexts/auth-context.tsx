
"use client";

import type { User, UserRole } from '@/lib/types'; 
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// Mock assignable users with roles
const MOCK_USERS_LIST: User[] = [
  { id: 'user-alice-01', email: 'alice@example.com', name: 'Alice Wonderland', role: 'admin' },
  { id: 'user-bob-02', email: 'bob@example.com', name: 'Bob The Builder', role: 'member' },
  { id: 'user-charlie-03', email: 'charlie@example.com', name: 'Charlie Brown', role: 'member' },
  { id: 'user-diana-04', email: 'diana@example.com', name: 'Diana Prince', role: 'member' },
];

interface AuthContextType {
  user: User | null;
  login: (email: string) => void; 
  logout: () => void;
  signup: (email: string) => void; 
  isLoading: boolean;
  assignableUsers: User[]; // List of users that can be assigned to tasks
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const assignableUsers = MOCK_USERS_LIST; 

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user from localStorage:", error);
        localStorage.removeItem('currentUser'); // Clear corrupted data
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (email: string) => {
    const existingMockUser = MOCK_USERS_LIST.find(u => u.email === email);
    let authUser: User;

    if (existingMockUser) {
      authUser = existingMockUser;
    } else {
      // Create a new user object if not in the mock list, default role to 'member'
      authUser = { 
        id: uuidv4(), 
        email, 
        name: email.split('@')[0],
        role: 'member' // Default role for new signups
      };
    }
    
    localStorage.setItem('currentUser', JSON.stringify(authUser));
    setUser(authUser);
    router.push('/dashboard');
  };

  const login = useCallback((email: string) => {
    handleAuthSuccess(email);
  }, [router]);

  const signup = useCallback((email: string) => {
    handleAuthSuccess(email);
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login'); 
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isLoading, assignableUsers }}>
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
