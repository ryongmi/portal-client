import { authApi, tokenManager } from "@/lib/axios";
import type { ApiResponse } from "@/lib/axios";

// 공유 라이브러리 인터페이스 활용
import type { 
  AuthLoginRequest, 
  AuthLoginResponse, 
  AuthSignupRequest, 
  AuthRefreshResponse 
} from "@krgeobuk/auth";
import type { UserDetail } from "@krgeobuk/user";
import type { LoggedInUser } from "@krgeobuk/shared";

// 타입 별칭 정의 (명확성을 위해)
type LoginRequest = AuthLoginRequest;
type SignupRequest = AuthSignupRequest;
type LoginResponse = AuthLoginResponse;
type UserMeResponse = UserDetail;
type RefreshResponse = AuthRefreshResponse;

export class AuthService {
  /**
   * 로그인
   */
  static async login(
    credentials: LoginRequest
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await authApi.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials
    );

    // 토큰 저장
    if (response.data.data?.accessToken) {
      tokenManager.setAccessToken(response.data.data.accessToken);
    }

    return response.data;
  }

  /**
   * 회원가입
   */
  static async signup(
    userData: SignupRequest
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await authApi.post<ApiResponse<LoginResponse>>(
      "/auth/signup",
      userData
    );

    // 회원가입 성공 시 자동 로그인 처리
    if (response.data.data?.accessToken) {
      tokenManager.setAccessToken(response.data.data.accessToken);
    }

    return response.data;
  }

  /**
   * 로그아웃
   */
  static async logout(): Promise<ApiResponse<null>> {
    const response = await authApi.post<ApiResponse<null>>("/auth/logout");

    // 토큰 제거
    tokenManager.clearAccessToken();

    return response.data;
  }

  /**
   * 토큰 갱신
   */
  static async refresh(): Promise<ApiResponse<RefreshResponse>> {
    const response = await authApi.post<ApiResponse<RefreshResponse>>(
      "/auth/refresh"
    );

    // 새 토큰 저장
    if (response.data.data?.accessToken) {
      tokenManager.setAccessToken(response.data.data.accessToken);
    }

    return response.data;
  }

  /**
   * 현재 사용자 정보 조회
   */
  static async getMe(): Promise<ApiResponse<UserMeResponse>> {
    const response = await authApi.get<ApiResponse<UserMeResponse>>(
      "/users/me"
    );
    return response.data;
  }

  /**
   * 현재 로그인 상태 확인
   */
  static isLoggedIn(): boolean {
    return !!tokenManager.getAccessToken();
  }

  /**
   * OAuth 로그인 URL 생성
   */
  static getOAuthUrl(provider: "google" | "naver"): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_AUTH_SERVER_URL || "http://localhost:8000/api";
    return `${baseUrl}/oauth/login-${provider}`;
  }
}