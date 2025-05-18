
"use client";

import type { User, UserRole } from '@/lib/types'; 
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// Mock assignable users with roles
const INITIAL_MOCK_USERS_LIST: User[] = [
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
  updateUserRole: (userId: string, newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignableUsers, setAssignableUsers] = useState<User[]>(INITIAL_MOCK_USERS_LIST);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        // Ensure assignableUsers reflects any potential updates if a user from this list logged in
        // and their role might have been persisted differently in a more complex scenario.
        // For this mock, we primarily rely on INITIAL_MOCK_USERS_LIST.
      } catch (error) {
        console.error("Error parsing stored user from localStorage:", error);
        localStorage.removeItem('currentUser'); // Clear corrupted data
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (email: string) => {
    // Check against the current state of assignableUsers, not just INITIAL_MOCK_USERS_LIST
    const existingMockUser = assignableUsers.find(u => u.email === email);
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
      // Add new user to assignableUsers list if they are not a mock user
      setAssignableUsers(prev => [...prev, authUser]);
    }
    
    localStorage.setItem('currentUser', JSON.stringify(authUser));
    setUser(authUser);
    router.push('/dashboard');
  };

  const login = useCallback((email: string) => {
    handleAuthSuccess(email);
  }, [router, assignableUsers]); // Add assignableUsers as a dependency

  const signup = useCallback((email: string) => {
    handleAuthSuccess(email);
  }, [router, assignableUsers]); // Add assignableUsers as a dependency

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login'); 
  }, [router]);

  const updateUserRole = useCallback((userId: string, newRole: UserRole) => {
    setAssignableUsers(prevUsers =>
      prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    // Also update current logged-in user if it's them
    if (user?.id === userId) {
      const updatedCurrentUser = { ...user, role: newRole };
      setUser(updatedCurrentUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    }
  }, [user, setUser]);


  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isLoading, assignableUsers, updateUserRole }}>
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
