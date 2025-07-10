import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { snakeToCamel, camelToSnake } from "@/utils/caseConverter";

// 공유 라이브러리 인터페이스 활용
import type { 
  AuthLoginRequest, 
  AuthLoginResponse, 
  AuthSignupRequest, 
  AuthRefreshResponse 
} from "@krgeobuk/auth";
import type { UserDetail } from "@krgeobuk/user";
import type { JwtPayload } from "@krgeobuk/jwt";

// 백엔드 응답 타입 정의 (snake_case)
interface BackendResponse<T = unknown> {
  code: string;
  status_code: number;
  message: string;
  isLogin: boolean;
  data: T;
}

// 프론트엔드에서 사용할 응답 타입 (camelCase)
interface ApiResponse<T = unknown> {
  code: string;
  statusCode: number;
  message: string;
  isLogin: boolean;
  data: T;
}

// Auth Server 인스턴스
export const authApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_AUTH_SERVER_URL || "http://localhost:8000/api",
  timeout: 10000,
  withCredentials: true, // 쿠키 포함 (refresh token용)
  headers: {
    "Content-Type": "application/json",
  },
});

// Authz Server 인스턴스
export const authzApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTHZ_SERVER_URL || "http://localhost:8100",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 토큰 관리
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
  }
}

const tokenManager = TokenManager.getInstance();

// 요청 인터셉터 (camelCase -> snake_case)
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // Authorization 헤더 추가
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 요청 데이터를 snake_case로 변환
  if (config.data) {
    config.data = camelToSnake(config.data);
  }

  return config;
};

// 응답 인터셉터 (snake_case -> camelCase)
const responseInterceptor = (response: AxiosResponse<BackendResponse>) => {
  // 전체 응답 객체를 camelCase로 변환
  const transformedResponse = snakeToCamel(response.data);

  return {
    ...response,
    data: transformedResponse,
  };
};

// 에러 인터셉터
const errorInterceptor = async (error: unknown) => {
  const axiosError = error as {
    config?: { _retry?: boolean };
    response?: { status?: number };
  };
  
  const originalRequest = axiosError.config;

  // 401 에러 시 토큰 갱신 시도
  if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      // refresh 토큰으로 새 access token 요청
      const refreshResponse = await authApi.post("/auth/refresh");
      const newToken = (refreshResponse.data.data as { accessToken: string }).accessToken;

      tokenManager.setAccessToken(newToken);

      // 실패했던 요청 재시도
      const requestWithAuth = {
        ...originalRequest,
        headers: {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        },
      };
      return authApi(requestWithAuth);
    } catch (refreshError) {
      // Refresh 실패 시 로그아웃 처리
      tokenManager.clearAccessToken();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};

// 인터셉터 적용
[authApi, authzApi].forEach((api) => {
  api.interceptors.request.use(requestInterceptor);
  api.interceptors.response.use(responseInterceptor, errorInterceptor);
});

export { tokenManager };
export type { ApiResponse, BackendResponse };