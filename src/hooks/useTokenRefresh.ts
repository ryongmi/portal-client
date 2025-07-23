import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setAccessToken, clearUser } from '@/store/slices/authSlice';

export const useTokenRefresh = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 토큰 갱신 성공 이벤트 리스너
    const handleTokenRefreshed = (event: CustomEvent) => {
      const { accessToken } = event.detail;
      dispatch(setAccessToken(accessToken));
    };

    // 토큰 만료 이벤트 리스너
    const handleTokenExpired = () => {
      dispatch(clearUser());
    };

    // 이벤트 리스너 등록
    window.addEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
    window.addEventListener('tokenExpired', handleTokenExpired);

    // 클린업
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, [dispatch]);
};

export default useTokenRefresh;