'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initializeAuth } from '@/store/slices/authSlice';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { tokenManager } from '@/utils/tokenManager';
import { SecuritySession, SecurityLogger, loginRateLimiter } from '@/utils/security';
import TokenExpirationWarning from './TokenExpirationWarning';
import SessionManager from './SessionManager';
import TokenStatus from '../common/TokenStatus';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isInitialized, isAuthenticated } = useAppSelector((state) => state.auth);
  const initializationAttempted = useRef(false);
  const securityChecksEnabled = useRef(true);
  
  // 토큰 갱신 이벤트 리스너 설정
  useTokenRefresh();

  // 보안 세션 초기화
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      
      // 세션 유효성 검증
      const isValidSession = SecuritySession.validateSession();
      
      if (!isValidSession) {
        // 세션이 유효하지 않으면 새로 생성
        SecuritySession.generateSession();
        SecurityLogger.logSecurityEvent('NEW_SESSION_CREATED', {
          reason: 'Invalid or missing session'
        });
      }
      
      if (!isInitialized) {
        dispatch(initializeAuth());
      }
    }
  }, [dispatch, isInitialized]);

  // 보안 모니터링
  useEffect(() => {
    if (!securityChecksEnabled.current) return;
    
    const handleSecurityCheck = () => {
      // 세션 무결성 검증
      if (isAuthenticated && !SecuritySession.validateSession()) {
        SecurityLogger.logSecurityEvent('SESSION_INTEGRITY_VIOLATION', {
          timestamp: Date.now()
        });
        
        // 세션 무결성 위반 시 로그아웃
        SecuritySession.clearSession();
        tokenManager.clearAccessToken();
        window.location.href = '/auth/login';
      }
    };

    // 주기적 보안 검사 (5분마다)
    const securityInterval = setInterval(handleSecurityCheck, 5 * 60 * 1000);
    
    // 원도우 포커스 시 보안 검사
    const handleWindowFocus = () => {
      handleSecurityCheck();
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      clearInterval(securityInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated]);

  // 비정상적인 연속 요청 감지
  useEffect(() => {
    let requestCount = 0;
    const timeWindow = 60 * 1000; // 1분
    const maxRequests = 100; // 1분에 최대 100요청
    
    const monitorRequests = () => {
      requestCount++;
      
      if (requestCount > maxRequests) {
        SecurityLogger.logSecurityEvent('EXCESSIVE_REQUESTS_DETECTED', {
          count: requestCount,
          timeWindow,
          userAgent: navigator.userAgent
        });
        
        // 요청 과다 시 일시적 제한
        securityChecksEnabled.current = false;
        setTimeout(() => {
          securityChecksEnabled.current = true;
          requestCount = 0;
        }, timeWindow);
      }
    };
    
    // 전역 이벤트 리스너 등록
    window.addEventListener('beforeunload', () => {
      SecurityLogger.logSecurityEvent('SESSION_END', {
        duration: Date.now() - (SecuritySession as any).startTime
      });
    });
    
    // 취약점 스캔 경고
    const detectVulnerabilities = () => {
      // console.log 함수 오버라이드 감지
      if (console.log.toString().includes('native code') === false) {
        SecurityLogger.logSecurityEvent('CONSOLE_OVERRIDE_DETECTED', {
          timestamp: Date.now()
        });
      }
      
      // 개발자 도구 감지 (프로덕션에서만)
      if (process.env.NODE_ENV === 'production') {
        const devtools = {
          open: false,
          orientation: null as string | null
        };
        
        setInterval(() => {
          if (window.outerWidth - window.innerWidth > 160 || 
              window.outerHeight - window.innerHeight > 160) {
            if (!devtools.open) {
              devtools.open = true;
              SecurityLogger.logSecurityEvent('DEVTOOLS_OPENED', {
                timestamp: Date.now(),
                userAgent: navigator.userAgent
              });
            }
          } else {
            devtools.open = false;
          }
        }, 1000);
      }
    };
    
    // 보안 검사 시작
    setTimeout(detectVulnerabilities, 5000);
    
    return () => {
      // 정리 작업
    };
  }, []);

  // 컴포넌트 언마운트 시 토큰 관리자 정리
  useEffect(() => {
    return () => {
      tokenManager.cleanup();
      SecurityLogger.logSecurityEvent('AUTH_PROVIDER_UNMOUNT', {
        timestamp: Date.now()
      });
    };
  }, []);

  return (
    <>
      {children}
      <SessionManager />
      <TokenExpirationWarning />
      {process.env.NODE_ENV === 'development' && <TokenStatus />}
    </>
  );
};

export default AuthProvider;