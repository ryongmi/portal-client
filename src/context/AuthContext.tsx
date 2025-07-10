"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService } from "@/services/authService";
import type { UserDetail } from "@krgeobuk/user";

interface AuthContextType {
  user: UserDetail | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    email: string;
    password: string;
    name: string;
    nickname?: string;
    profileImageUrl?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 조회
  const refreshUser = async () => {
    try {
      const response = await AuthService.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      setUser(null);
    }
  };

  // 초기 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (AuthService.isLoggedIn()) {
        await refreshUser();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 로그인
  const login = async (email: string, password: string) => {
    const response = await AuthService.login({ email, password });
    if (response.data?.user) {
      setUser(response.data.user as UserDetail);
    }
  };

  // 회원가입
  const signup = async (userData: {
    email: string;
    password: string;
    name: string;
    nickname?: string;
    profileImageUrl?: string;
  }) => {
    const response = await AuthService.signup(userData);
    if (response.data?.user) {
      setUser(response.data.user as UserDetail);
    }
  };

  // 로그아웃
  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoggedIn: !!user,
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