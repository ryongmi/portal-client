import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { SecuritySession, SecurityLogger, validateURL, validateUserInput, validateApiRequestData } from '@/utils/security';

// 공유 라이브러리 인터페이스 활용
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthSignupRequest,
  AuthRefreshResponse,
} from '@krgeobuk/auth';
import type { UserDetail } from '@krgeobuk/user';
import type { JwtPayload } from '@krgeobuk/jwt';

// API 응답 타입 정의 (camelCase 통일)
interface ApiResponse<T = unknown> {
  code: string;
  statusCode: number;
  message: string;
  isLogin: boolean;
  data: T;
}

// 에러 응답 타입 정의
interface ApiErrorData {
  message?: string;
  errors?: string[] | Record<string, string[]>;
}

// 에러 객체 타입 정의
interface ApiError {
  config?: {
    url?: string;
    method?: string;
  };
  response?: {
    status?: number;
    data?: ApiErrorData;
    headers?: Record<string, string>;
  };
  message?: string;
  code?: string;
}

// Axios 인스턴스 타입 (기본적인 속성만 포함)
interface AxiosInstanceLike {
  defaults: {
    baseURL?: string;
    headers?: Record<string, unknown>;
  };
}

// 보안 설정
const ALLOWED_ORIGINS = ['localhost', 'krgeobuk.com', '127.0.0.1'];

// 기본 요청 헤더 (보안 헤더 제거)
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Auth Server 인스턴스
export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:8000/api',
  timeout: 10000,
  withCredentials: true, // 쿠키 포함 (refresh token용)
  headers: defaultHeaders,
});

// Authz Server 인스턴스
export const authzApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTHZ_SERVER_URL || 'http://localhost:8100',
  timeout: 10000,
  withCredentials: true,
  headers: defaultHeaders,
});

// Portal Server 인스턴스
export const portalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PORTAL_SERVER_URL || 'http://localhost:8200',
  timeout: 10000,
  withCredentials: true,
  headers: defaultHeaders,
});

// 토큰 관리자 임포트
import { tokenManager } from '@/utils/tokenManager';
import { setupTokenInterceptor } from '@/utils/apiInterceptor';

// 보안 강화된 요청 인터셉터
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // CSRF 토큰 추가
  const csrfToken = SecuritySession.getCSRFToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // Authorization 헤더 추가
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 요청 URL 검증
  if (config.url && config.baseURL) {
    const fullUrl = new URL(config.url, config.baseURL).toString();
    if (!validateURL(fullUrl, ALLOWED_ORIGINS)) {
      SecurityLogger.logSecurityEvent('INVALID_REQUEST_URL', {
        url: fullUrl,
        baseURL: config.baseURL,
      });
      throw new Error('Invalid request URL');
    }
  }

  // 요청 데이터 검증
  if (config.data) {
    // API 요청 데이터 보안 검증 (JSON 객체 고려)
    if (!validateApiRequestData(config.data)) {
      SecurityLogger.logSecurityEvent('SUSPICIOUS_INPUT_DETECTED', {
        data: JSON.stringify(config.data).substring(0, 100), // 로그에는 일부만 기록
      });
      throw new Error('Invalid input data detected');
    }
  }

  // 요청 ID 추가 (추적용)
  config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return config;
};

// 응답 인터셉터
const responseInterceptor = (response: AxiosResponse<ApiResponse>) => {
  // 응답 데이터 그대로 반환 (camelCase 통일)
  return response;
};

// 보안 강화된 에러 인터셉터
const errorInterceptor = async (error: unknown) => {
  const axiosError = error as {
    config?: {
      _retry?: boolean;
      headers?: Record<string, string>;
      skipGlobalErrorHandler?: boolean;
      url?: string;
      method?: string;
    };
    response?: {
      status?: number;
      data?: ApiErrorData;
      headers?: Record<string, string>;
    };
    message?: string;
    code?: string;
  };

  const originalRequest = axiosError.config;

  // 보안 이벤트 로깅
  if (axiosError.response?.status) {
    const status = axiosError.response.status;

    // 보안 관련 상태 코드 로깅
    if ([401, 403, 429].includes(status)) {
      SecurityLogger.logSecurityEvent('SECURITY_ERROR', {
        status,
        url: originalRequest?.url,
        method: originalRequest?.method,
        userAgent: navigator.userAgent,
      });
    }

    // 429 (Rate Limit) 에러 시 특별 처리
    if (status === 429) {
      SecurityLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        url: originalRequest?.url,
        timestamp: Date.now(),
      });

      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast.warning(
          '요청 제한',
          '너무 많은 요청을 보내고 있습니다. 잠시 후 다시 시도해주세요.'
        );
      }
    }
  }

  // 401 에러 시 토큰 갱신 시도
  if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
    originalRequest._retry = true;

    // 세션 유효성 재검증
    if (!SecuritySession.validateSession()) {
      SecurityLogger.logSecurityEvent('INVALID_SESSION_ON_401', {
        url: originalRequest.url,
      });

      if (typeof window !== 'undefined') {
        SecuritySession.clearSession();
        window.location.href = '/auth/login';
      }
      return Promise.reject(new Error('Invalid session'));
    }

    try {
      // TokenManager를 통한 토큰 갱신
      const newToken = await tokenManager.refreshToken();

      // CSRF 토큰 재생성
      const newCsrfToken = SecuritySession.getCSRFToken();

      // 실패했던 요청 재시도
      const requestWithAuth = {
        ...originalRequest,
        headers: {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
          'X-CSRF-Token': newCsrfToken || '',
        },
      };
      return authApi(requestWithAuth);
    } catch (refreshError) {
      // Refresh 실패 로깅
      SecurityLogger.logSecurityEvent('TOKEN_REFRESH_FAILED', {
        error: refreshError,
        originalUrl: originalRequest.url,
      });

      // Refresh 실패 시 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        SecuritySession.clearSession();

        // 토스트 알림
        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast.error('세션 만료', '다시 로그인해주세요.');
        }

        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1000);
      }
      return Promise.reject(refreshError);
    }
  }

  // 전역 에러 처리 건너뛰기 옵션이 있으면 바로 reject
  if (originalRequest?.skipGlobalErrorHandler) {
    return Promise.reject(error);
  }

  // 클라이언트 사이드에서만 토스트 알림 표시
  if (typeof window !== 'undefined' && (window as any).showToast) {
    const showErrorToast = (window as any).showToast;

    // 특정 에러들은 토스트로 표시하지 않음 (페이지에서 직접 처리)
    const skipToastStatuses = [400, 422]; // 검증 에러 등

    if (!skipToastStatuses.includes(axiosError.response?.status ?? 0)) {
      const errorMessage = getGlobalErrorMessage(axiosError);
      showErrorToast.error('오류 발생', errorMessage);
    }
  }

  // 보안 관련 에러 로깅 강화
  if (originalRequest) {
    const errorDetails = {
      url: originalRequest.url,
      method: originalRequest.method,
      status: axiosError.response?.status,
      message: axiosError.message,
      timestamp: new Date().toISOString(),
      requestId: originalRequest.headers?.['X-Request-ID'],
      userAgent: navigator.userAgent,
    };

    // 프로덕션 환경에서 상세 로깅
    if (process.env.NODE_ENV === 'production') {
      SecurityLogger.logSecurityEvent('API_ERROR', errorDetails);
    } else {
      console.error('API Error:', errorDetails);
    }
  }

  return Promise.reject(error);
};

// 보안 강화된 전역 에러 메시지 생성 함수
function getGlobalErrorMessage(error: ApiError): string {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // 보안 관련 에러는 제한된 정보만 노출
  switch (status) {
    case 401:
      return '인증이 필요합니다. 다시 로그인해주세요.';
    case 403:
      SecurityLogger.logSecurityEvent('ACCESS_DENIED', {
        url: error?.config?.url,
        timestamp: Date.now(),
      });
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 422:
      return '입력 데이터를 확인해주세요.';
    case 429:
      return '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    case 500:
      return '서버 내부 오류가 발생했습니다.';
    case 502:
      return '서버 게이트웨이 오류가 발생했습니다.';
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.';
    case 504:
      return '서버 응답 시간이 초과되었습니다.';
    default:
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
        return '네트워크 연결을 확인해주세요.';
      }

      // 개발 환경에서만 상세 에러 메시지 표시
      if (process.env.NODE_ENV === 'development') {
        return data?.message || error?.message || '알 수 없는 오류가 발생했습니다.';
      }

      // 프로덕션에서는 일반적인 메시지만 표시
      return '요청 처리 중 오류가 발생했습니다.';
  }
}

// 보안 검증 함수
function validateApiInstance(api: AxiosInstanceLike): void {
  if (!api.defaults.baseURL) {
    throw new Error('API instance must have a baseURL');
  }

  const url = new URL(api.defaults.baseURL);
  if (!validateURL(url.toString(), ALLOWED_ORIGINS)) {
    SecurityLogger.logSecurityEvent('INVALID_API_BASEURL', {
      baseURL: api.defaults.baseURL,
    });
    throw new Error('Invalid API base URL');
  }
}

// 인터셉터 적용
[authApi, authzApi, portalApi].forEach((api) => {
  // API 인스턴스 보안 검증
  validateApiInstance(api);

  api.interceptors.request.use(requestInterceptor, (error) => {
    SecurityLogger.logSecurityEvent('REQUEST_INTERCEPTOR_ERROR', { error });
    return Promise.reject(error);
  });

  api.interceptors.response.use(responseInterceptor, errorInterceptor);

  // 향상된 토큰 인터셉터 적용
  setupTokenInterceptor(api as any);
});

export { tokenManager };
export type { ApiResponse };

