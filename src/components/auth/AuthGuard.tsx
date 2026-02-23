'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth: _requireAuth = false, // portal-client는 기본적으로 인증 불필요 (현재 미사용)
}) => {
  const { isInitialized } = useAuthStore();
  const { isLoading } = useAuth();

  // 초기화 완료 전 또는 로딩 중일 때 로딩 화면 표시
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로딩 완료 후에는 항상 children 렌더링 (자동 리다이렉트 없음)
  // 개별 컴포넌트에서 인증 상태에 따른 UI 처리
  return <>{children}</>;
};

export default AuthGuard;
