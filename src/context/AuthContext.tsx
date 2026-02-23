'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthInitialize } from '@/hooks/queries/useAuthInitialize';
import { useLogout } from '@/hooks/mutations/useLogout';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@krgeobuk/user/interfaces';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const { setAuthenticated, setInitialized, clearAuth, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogout();

  // 앱 초기화 query
  const initQuery = useAuthInitialize();

  // react-query 결과를 Zustand 상태로 동기화
  useEffect(() => {
    if (initQuery.isSuccess) {
      const { isLogin, user } = initQuery.data;
      setAuthenticated(!!(isLogin && user));
      setInitialized(true);
    } else if (initQuery.isError) {
      setAuthenticated(false);
      setInitialized(true);
    }
  }, [initQuery.isSuccess, initQuery.isError, initQuery.data, setAuthenticated, setInitialized]);

  // tokenCleared 이벤트 (shared-lib에서 발생)
  useEffect(() => {
    const handleTokenCleared = (): void => clearAuth();
    window.addEventListener('tokenCleared', handleTokenCleared);
    return (): void => window.removeEventListener('tokenCleared', handleTokenCleared);
  }, [clearAuth]);

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const refreshUser = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
  };

  // isAuthenticated가 false로 바뀌면 myProfile 캐시 제거
  useEffect(() => {
    if (!isAuthenticated) {
      void queryClient.removeQueries({ queryKey: ['myProfile'] });
    }
  }, [isAuthenticated, queryClient]);

  const value: AuthContextType = {
    user: initQuery.data?.user ?? null,
    loading: initQuery.isPending,
    isLoggedIn: isAuthenticated,
    error: initQuery.error ? String(initQuery.error) : null,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
