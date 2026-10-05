import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setCachedToken, setOnUnauthorizedCallback } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  demoLogin: (role?: 'OWNER' | 'SUPERVISOR') => Promise<void>;
  register: (name: string, email: string, pass: string, role?: string, phone?: string) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  resendOtp: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
  logout: () => Promise<void>;
  isOwner: boolean;
  isSupervisor: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      logout();
    });
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@r2r_jwt_token');
      const storedUser = await AsyncStorage.getItem('@r2r_user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setCachedToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Instant UI unlock - never block app startup for network
        setIsLoading(false);

        // Demo tokens don't call live backend me endpoint
        if (storedToken.startsWith('demo_')) {
          return;
        }

        // Verify/refresh user data in background silently
        api.get('/auth/me').then(async (res) => {
          if (res.data?.success) {
            setUser(res.data.user);
            await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(res.data.user));
          }
        }).catch((err) => {
          if (err?.status === 401 || err?.response?.status === 401) {
            logout();
          }
        });
        return;
      }
    } catch (err) {
      console.error('Failed to load auth state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      if (res.data?.success && res.data.token) {
        const { token, user } = res.data;
        setToken(token);
        setCachedToken(token);
        setUser(user);
        await AsyncStorage.setItem('@r2r_jwt_token', token);
        await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(user));
      }
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'OWNER' | 'SUPERVISOR' = 'SUPERVISOR') => {
    setIsLoading(true);
    try {
      const dummyUser: User = {
        id: role === 'OWNER' ? 'owner_demo' : 'supervisor_demo',
        name: role === 'OWNER' ? 'Ghanshyam (Owner)' : 'Supervisor Raj',
        email: role === 'OWNER' ? 'owner@randd.com' : 'raj@randd.com',
        phone: '+91 98765 43210',
        role,
        companyName: 'R&D CONSTRUCTIONS'
      };
      const dummyToken = 'demo_offline_jwt_token_12345';
      setToken(dummyToken);
      setCachedToken(dummyToken);
      setUser(dummyUser);
      await AsyncStorage.setItem('@r2r_jwt_token', dummyToken);
      await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(dummyUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, role?: string, phone?: string) => {
    const res = await api.post('/auth/register', { name, email, password: pass, role, phone });
    if (res.data?.success && res.data.token) {
      const { token, user } = res.data;
      setToken(token);
      setCachedToken(token);
      setUser(user);
      await AsyncStorage.setItem('@r2r_jwt_token', token);
      await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(user));
    }
    return res.data;
  };

  const verifyOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data?.success && res.data.token) {
        const { token, user } = res.data;
        setToken(token);
        setCachedToken(token);
        setUser(user);
        await AsyncStorage.setItem('@r2r_jwt_token', token);
        await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(user));
      }
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email: string) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  const forgotPassword = async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword });
    if (res.data?.success && res.data.token) {
      const { token, user } = res.data;
      setToken(token);
      setCachedToken(token);
      setUser(user);
      await AsyncStorage.setItem('@r2r_jwt_token', token);
      await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@r2r_jwt_token',
        '@r2r_user_data',
        '@r2r_cached_sites',
        '@r2r_pending_expenses'
      ]);
    } catch (e) {
      console.error('Error during logout:', e);
    } finally {
      setCachedToken(null);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        demoLogin,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        isOwner: user?.role?.toUpperCase() === 'OWNER',
        isSupervisor: ['SUPERVISOR', 'SUPERWISER', 'OWNER'].includes(user?.role?.toUpperCase() || '')
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
