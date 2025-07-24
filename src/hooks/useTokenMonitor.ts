import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { refreshToken, clearUser } from '@/store/slices/authSlice';
import { tokenManager } from '@/lib/httpClient';

interface TokenMonitorState {
  isExpiringSoon: boolean;
  timeRemaining: number;
  isRefreshing: boolean;
}

export const useTokenMonitor = () => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [state, setState] = useState<TokenMonitorState>({
    isExpiringSoon: false,
    timeRemaining: 0,
    isRefreshing: false,
  });

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setState({
        isExpiringSoon: false,
        timeRemaining: 0,
        isRefreshing: false,
      });
      return;
    }

    const checkToken = () => {
      const expirationTime = tokenManager.getTokenExpiration(accessToken);
      const timeRemaining = Math.max(0, expirationTime - Date.now());
      const isExpiringSoon = tokenManager.isTokenExpiringSoon(accessToken);

      setState(prev => ({
        ...prev,
        isExpiringSoon,
        timeRemaining,
      }));

      // 토큰이 만료되었으면 로그아웃 처리
      if (tokenManager.isTokenExpired(accessToken)) {
        dispatch(clearUser());
      }
    };

    // 초기 체크
    checkToken();

    // 30초마다 체크
    const interval = setInterval(checkToken, 30000);

    return () => clearInterval(interval);
  }, [accessToken, isAuthenticated, dispatch]);

  const extendSession = async () => {
    if (state.isRefreshing) return;

    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      await dispatch(refreshToken()).unwrap();
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      dispatch(clearUser());
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  return {
    ...state,
    extendSession,
  };
};

export default useTokenMonitor;