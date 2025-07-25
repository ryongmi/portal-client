'use client';

import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ToastContainer, { toast } from '@/components/common/ToastContainer';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // 전역 toast 함수를 window 객체에 등록 (axios interceptor에서 사용)
    if (typeof window !== 'undefined') {
      (window as any).showToast = toast;
    }

    // 전역 에러 핸들러
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      // 프로덕션에서는 에러 로깅 서비스로 전송
      if (process.env.NODE_ENV === 'production') {
        console.error('Production Unhandled Rejection:', {
          reason: event.reason?.toString(),
          stack: event.reason?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });
      }

      // 사용자에게 알림 (너무 많은 알림을 피하기 위해 제한)
      if (!event.reason?.message?.includes('Network Error')) {
        toast.error('예상치 못한 오류', '문제가 지속되면 페이지를 새로고침해주세요.', {
          duration: 3000,
        });
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);

      // 프로덕션에서는 에러 로깅 서비스로 전송
      if (process.env.NODE_ENV === 'production') {
        console.error('Production Global Error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.toString(),
          stack: event.error?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // 정리 함수
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);

      // window 객체에서 toast 함수 제거
      if (typeof window !== 'undefined') {
        delete (window as any).showToast;
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Provider store={store}>
          <AuthProvider>
            {children}
            <ToastContainer position="top-right" maxToasts={5} />
          </AuthProvider>
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
