import { useState, useEffect } from "react";
import { AuthService } from "@/services/authService";
import type { UserDetail } from "@krgeobuk/user";

// 공유 라이브러리 인터페이스 활용
type User = UserDetail;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (AuthService.isLoggedIn()) {
        try {
          const response = await AuthService.getMe();
          setUser(response.data); // 이미 camelCase로 변환됨
        } catch (error) {
          console.error("사용자 정보 조회 실패:", error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return {
    user,
    loading,
    isLoggedIn: !!user,
    logout,
  };
}