"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { store } from "@/store";
import { loginUser, signupUser, logoutUser, fetchUserProfile, initializeAuth, setOAuthToken, clearUser } from "@/store/slices/authSlice";
import { tokenManager } from "@/lib/axios";
import type { User, LoginRequest, SignupRequest } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error, isInitialized } = useAppSelector((state) => state.auth);
  const initializeRef = useRef(false);

  // 초기 인증 상태 확인 (쿠키 기반)
  useEffect(() => {
    const checkInitialAuth = async () => {
      // 이미 초기화되었거나 진행 중이면 스킵 (StrictMode 대응)
      if (isInitialized || isLoading || initializeRef.current) {
        return;
      }

      initializeRef.current = true;

      try {
        await dispatch(initializeAuth()).unwrap();
      } catch (error) {
        // 인증되지 않은 사용자
      } finally {
        // 초기화 완료 후 플래그 해제
        initializeRef.current = false;
      }
    };

    // TokenManager 이벤트 리스너 설정
    const handleTokenCleared = () => {
      dispatch(clearUser());
    };

    const handleTokenExpired = () => {
      dispatch(clearUser());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tokenCleared', handleTokenCleared);
      window.addEventListener('tokenExpired', handleTokenExpired);
    }

    checkInitialAuth();

    // 클리너업 함수
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tokenCleared', handleTokenCleared);
        window.removeEventListener('tokenExpired', handleTokenExpired);
      }
    };
  }, [dispatch, isInitialized, isLoading]);

  // 로그인
  const login = async (email: string, password: string) => {
    const loginData: LoginRequest = { email, password };
    await dispatch(loginUser(loginData)).unwrap();
  };

  // 회원가입
  const signup = async (userData: SignupRequest) => {
    await dispatch(signupUser(userData)).unwrap();
  };

  // 로그아웃
  const logout = async () => {
    await dispatch(logoutUser()).unwrap();
  };

  // 사용자 정보 갱신
  const refreshUser = async () => {
    await dispatch(fetchUserProfile()).unwrap();
  };

  const value: AuthContextType = {
    user,
    loading: isLoading,
    isLoggedIn: isAuthenticated,
    error,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}