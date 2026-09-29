import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role?: 'OWNER' | 'SUPERVISOR') => Promise<void>;
  register: (name: string, email: string, pass: string, role?: string, phone?: string) => Promise<void>;
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
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@r2r_jwt_token');
      const storedUser = await AsyncStorage.getItem('@r2r_user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.user);
            await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(res.data.user));
          }
        } catch (e) {
          console.log('Offline mode active - using stored user data');
        }
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
      if (res.data?.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        await AsyncStorage.setItem('@r2r_jwt_token', token);
        await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(user));
      }
    } catch (err: any) {
      // If network fails to connect to local IP, provide offline fallback prompt option
      throw err;
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
        email: role === 'OWNER' ? 'owner@r2r.com' : 'raj@r2r.com',
        phone: '+91 98765 43210',
        role,
        companyName: 'R2R – Raw to Refined'
      };
      const dummyToken = 'demo_offline_jwt_token_12345';
      setToken(dummyToken);
      setUser(dummyUser);
      await AsyncStorage.setItem('@r2r_jwt_token', dummyToken);
      await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(dummyUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, role?: string, phone?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password: pass, role, phone });
      if (res.data?.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        await AsyncStorage.setItem('@r2r_jwt_token', token);
        await AsyncStorage.setItem('@r2r_user_data', JSON.stringify(user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('@r2r_jwt_token');
    await AsyncStorage.removeItem('@r2r_user_data');
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
        logout,
        isOwner: user?.role === 'OWNER',
        isSupervisor: user?.role === 'SUPERVISOR' || user?.role === 'OWNER'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
