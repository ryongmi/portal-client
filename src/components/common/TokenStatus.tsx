'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { tokenManager } from '@/utils/tokenManager';

export const TokenStatus: React.FC = () => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const [tokenInfo, setTokenInfo] = useState<{
    expirationTime: number;
    timeRemaining: number;
    isExpiringSoon: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setTokenInfo(null);
      return;
    }

    const updateTokenInfo = () => {
      const expirationTime = tokenManager.getTokenExpiration(accessToken);
      const timeRemaining = Math.max(0, expirationTime - Date.now());
      const isExpiringSoon = tokenManager.isTokenExpiringSoon(accessToken);

      setTokenInfo({
        expirationTime,
        timeRemaining,
        isExpiringSoon,
      });
    };

    // 초기 업데이트
    updateTokenInfo();

    // 1초마다 업데이트
    const interval = setInterval(updateTokenInfo, 1000);

    return () => clearInterval(interval);
  }, [accessToken, isAuthenticated]);

  if (!isAuthenticated || !tokenInfo) {
    return null;
  }

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    } else {
      return `${seconds}초`;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          tokenInfo.isExpiringSoon ? 'bg-red-500' : 'bg-green-500'
        }`} />
        <span className="text-gray-600">
          토큰 만료까지: {formatTime(tokenInfo.timeRemaining)}
        </span>
      </div>
    </div>
  );
};

export default TokenStatus;