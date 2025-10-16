import { authApi, tokenManager, type ApiResponse } from '@/lib/httpClient';
import type { User } from '@/types';
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
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await authApi.get<ApiResponse<User>>('users/me');
      return response.data.data;
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