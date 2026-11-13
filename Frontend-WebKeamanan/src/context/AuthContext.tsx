import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  isMfaEnabled?: boolean;
}

interface LoginResponse {
  mfaRequired: boolean;
  challengeToken?: string;
  emailMasked?: string;
  expiresInSeconds?: number;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfaOtp: (challengeToken: string, otp: string) => Promise<User>;
  resendMfaOtp: (challengeToken: string) => Promise<{ challengeToken: string; emailMasked: string }>;
  register: (email: string, password: string, fullName: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('examcenter_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('examcenter_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('examcenter_token', newToken);
    localStorage.setItem('examcenter_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('examcenter_token');
    localStorage.removeItem('examcenter_user');
  };

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('examcenter_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    const data = res.data;

    if (data.mfaRequired) {
      return {
        mfaRequired: true,
        challengeToken: data.challengeToken,
        emailMasked: data.emailMasked,
        expiresInSeconds: data.expiresInSeconds,
      };
    }

    if (data.token && data.user) {
      saveAuthSession(data.token, data.user);
      return {
        mfaRequired: false,
        user: data.user,
      };
    }

    throw new Error('Respon login dari server tidak valid.');
  };

  const verifyMfaOtp = async (challengeToken: string, otp: string): Promise<User> => {
    const res = await apiClient.post('/auth/verify-otp', { challengeToken, otp });
    const data = res.data;

    if (data.success && data.token && data.user) {
      saveAuthSession(data.token, data.user);
      return data.user;
    }

    throw new Error(data.message || 'Verifikasi OTP gagal.');
  };

  const resendMfaOtp = async (challengeToken: string) => {
    const res = await apiClient.post('/auth/resend-otp', { challengeToken });
    return res.data;
  };

  const register = async (email: string, password: string, fullName: string): Promise<User> => {
    const res = await apiClient.post('/auth/register', { email, password, fullName });
    const data = res.data;

    if (data.token && data.user) {
      saveAuthSession(data.token, data.user);
      return data.user;
    }

    throw new Error(data.message || 'Pendaftaran gagal.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        verifyMfaOtp,
        resendMfaOtp,
        register,
        logout,
        refreshUser,
      }}
    >
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

