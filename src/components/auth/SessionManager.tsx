'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { refreshToken, clearUser } from '@/store/slices/authSlice';
import { tokenManager } from '@/utils/tokenManager';

export const SessionManager: React.FC = () => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // 페이지 포커스 시 토큰 상태 확인
    const handleFocus = () => {
      if (tokenManager.isTokenExpired(accessToken)) {
        dispatch(clearUser());
      } else if (tokenManager.isTokenExpiringSoon(accessToken)) {
        // 토큰이 곧 만료되면 자동 갱신
        dispatch(refreshToken()).catch(() => {
          dispatch(clearUser());
        });
      }
    };

    // 페이지 가시성 변경 시 토큰 상태 확인
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };

    // 네트워크 상태 복구 시 토큰 상태 확인
    const handleOnline = () => {
      if (tokenManager.isTokenExpired(accessToken)) {
        dispatch(clearUser());
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [accessToken, isAuthenticated, dispatch]);

  return null; // 렌더링하지 않음
};

export default SessionManager;