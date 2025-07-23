'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { refreshToken } from '@/store/slices/authSlice';
import { tokenManager } from '@/utils/tokenManager';

export const TokenExpirationWarning: React.FC = () => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const checkTokenExpiration = () => {
      if (tokenManager.isTokenExpiringSoon(accessToken)) {
        const expirationTime = tokenManager.getTokenExpiration(accessToken);
        const timeUntilExpiration = Math.max(0, 
          Math.floor((expirationTime - Date.now()) / 1000)
        );
        
        setTimeRemaining(timeUntilExpiration);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // 초기 체크
    checkTokenExpiration();

    // 30초마다 체크
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [accessToken, isAuthenticated]);

  const handleExtendSession = async () => {
    try {
      await dispatch(refreshToken()).unwrap();
      setShowWarning(false);
    } catch (error) {
      console.error('세션 연장 실패:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            세션 만료 경고
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            {timeRemaining > 0 
              ? `세션이 ${formatTime(timeRemaining)} 후 만료됩니다.`
              : '세션이 곧 만료됩니다.'
            }
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleExtendSession}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              세션 연장
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationWarning;