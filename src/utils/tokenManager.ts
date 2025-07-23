import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  userId: string;
  email: string;
  name: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<string> | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Access Token 설정 (메모리 기반)
  setAccessToken(token: string) {
    this.accessToken = token;
    this.scheduleTokenRefresh(token);
    
    // Redux 상태 업데이트를 위한 이벤트 발행
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tokenUpdated', { 
        detail: { accessToken: token } 
      }));
    }
  }

  // Access Token 설정 (이벤트 발행 없이)
  setAccessTokenSilent(token: string) {
    this.accessToken = token;
    this.scheduleTokenRefresh(token);
  }

  // Access Token 가져오기 (메모리에서만)
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Access Token 삭제 (메모리에서만)
  clearAccessToken() {
    this.accessToken = null;
    this.clearRefreshTimer();
    
    // Redux 상태 클리어를 위한 이벤트 발행
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tokenCleared'));
    }
  }

  // 토큰 만료 시간 확인 (public으로 변경)
  getTokenExpiration(token: string): number {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000; // 밀리초로 변환
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
      return 0;
    }
  }

  // 토큰 만료 여부 확인
  isTokenExpired(token: string): boolean {
    const expirationTime = this.getTokenExpiration(token);
    return Date.now() >= expirationTime;
  }

  // 토큰 만료까지 남은 시간 계산 (밀리초)
  private getTimeUntilExpiration(token: string): number {
    const expirationTime = this.getTokenExpiration(token);
    return expirationTime - Date.now();
  }

  // 토큰 갱신 스케줄링
  private scheduleTokenRefresh(token: string) {
    this.clearRefreshTimer();

    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    // 만료 5분 전에 갱신 시도
    const refreshTime = Math.max(0, timeUntilExpiration - 5 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  // 토큰 갱신 타이머 정리
  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // 토큰 갱신 (중복 요청 방지)
  async refreshToken(): Promise<string> {
    // 이미 갱신 중인 경우 기존 Promise 반환
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  // 실제 토큰 갱신 수행
  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // HTTP-only 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('토큰 갱신 실패');
      }

      const data = await response.json();
      const newToken = data.data.accessToken;

      this.setAccessToken(newToken);

      return newToken;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      this.clearAccessToken();
      
      // 로그아웃 이벤트 발행
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tokenExpired'));
      }
      
      throw error;
    }
  }

  // 토큰이 곧 만료되는지 확인 (5분 이내)
  isTokenExpiringSoon(token: string): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    return timeUntilExpiration < 5 * 60 * 1000; // 5분 이내
  }

  // 토큰 유효성 검사
  isValidToken(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  }

  // 토큰에서 사용자 정보 추출
  getUserFromToken(token: string): Partial<JwtPayload> | null {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      };
    } catch (error) {
      console.error('토큰에서 사용자 정보 추출 실패:', error);
      return null;
    }
  }

  // 정리 함수 (컴포넌트 언마운트 시 호출)
  cleanup() {
    this.clearRefreshTimer();
    this.refreshPromise = null;
  }
}

export const tokenManager = TokenManager.getInstance();