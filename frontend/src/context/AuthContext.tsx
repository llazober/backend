import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setupSignalR, disconnectSignalR } from '../api/signalr';

export interface User {
  username: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSupervisor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('qc_user');
    const token = localStorage.getItem('qc_token');
    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      localStorage.setItem('qc_user', JSON.stringify(user));
      localStorage.setItem('qc_token', user.token);
      setupSignalR(queryClient);
    } else {
      localStorage.removeItem('qc_user');
      localStorage.removeItem('qc_token');
      disconnectSignalR();
    }
  }, [user, queryClient]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    queryClient.clear();
  };

  const isAuthenticated = !!user;
  const isSupervisor = user?.role === 'Supervisor';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isSupervisor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
