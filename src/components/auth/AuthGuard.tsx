'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    } else if (!requireAuth && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isInitialized, requireAuth, router, redirectTo]);

  // 초기화 중이거나 로딩 중일 때 로딩 화면
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증이 필요한 페이지인데 인증되지 않은 경우
  if (requireAuth && !isAuthenticated) {
    return null; // 리다이렉트 중이므로 빈 화면
  }

  // 인증이 필요하지 않은 페이지인데 인증된 경우
  if (!requireAuth && isAuthenticated) {
    return null; // 리다이렉트 중이므로 빈 화면
  }

  return <>{children}</>;
};

export default AuthGuard;