import { authApi, tokenManager } from '@/lib/httpClient';
import type { UserProfile } from '@krgeobuk/user/interfaces';
import { BaseService } from './base';

/**
 * 인증 관련 Service
 *
 * 사용자 인증, 로그아웃, 토큰 관리 등을 담당
 */
export class AuthService extends BaseService {
  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout');
      tokenManager.clearAccessToken();
    } catch (error) {
      // 로그아웃 실패해도 클라이언트 토큰은 제거
      tokenManager.clearAccessToken();
      this.handleError(error);
    }
  }

  /**
   * 클라이언트 초기화 (RefreshToken으로 AccessToken 및 사용자 정보 반환)
   * 페이지 로드 시 한 번만 호출하여 인증 상태 복원
   */
  async initialize(): Promise<{ accessToken: string; user: UserProfile; isLogin: boolean }> {
    try {
      const response = await authApi.post<{ accessToken: string; user: UserProfile }>(
        '/auth/initialize'
      );

      const { accessToken, user } = response.data;
      const { isLogin } = response;

      // AccessToken을 TokenManager에 저장
      tokenManager.setAccessToken(accessToken);

      return { accessToken, user, isLogin };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 현재 사용자 정보 조회 (OAuth, 권한, 서비스 정보 포함)
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await authApi.get<UserProfile>('users/me');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 현재 로그인 상태 확인 (토큰 존재 여부)
   */
  isLoggedIn(): boolean {
    const token = tokenManager.getAccessToken();
    return !!token && tokenManager.isValidToken(token);
  }

  /**
   * 토큰 갱신 (shared-lib에서 자동 처리되므로 백업용)
   */
  async refreshToken(): Promise<string> {
    try {
      // shared-lib의 TokenManager를 통한 자동 갱신
      return await tokenManager.refreshToken();
    } catch (error) {
      // 갱신 실패 시 로그아웃 처리
      tokenManager.clearAccessToken();
      this.handleError(error);
    }
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();
