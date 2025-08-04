/**
 * 보안 관련 유틸리티 함수들
 */

// 공통 패키지에서 보안 기능 import
import { 
  SecurityLogger, 
  RateLimiter, 
  SecuritySession,
  escapeHtml,
  sanitizeHtml,
  generateCSRFToken,
  generateSecureRandomString,
  validateURL,
  validateUserInput,
  validateApiRequestData,  
  maskSensitiveData,
  generateCSPHeader,
  SecureStorage
} from '@krgeobuk/http-client/security';

// 타입 정의
type ApiRequestData = Record<string, unknown> | string | number | boolean | null;

// 공통 패키지의 RateLimiter 사용
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5회 시도, 15분 윈도우

// SecureStorage는 공통 패키지에서 import하여 사용

// 공통 패키지에서 가져온 함수들과 클래스들을 다시 export
export { 
  SecurityLogger, 
  SecuritySession,
  SecureStorage,
  escapeHtml,
  sanitizeHtml,
  generateCSRFToken,
  generateSecureRandomString,
  validateURL,
  validateUserInput,
  validateApiRequestData,
  maskSensitiveData,
  generateCSPHeader
};

export default {
  escapeHtml,
  sanitizeHtml,
  generateCSRFToken,
  generateSecureRandomString,
  validateURL,
  validateUserInput,
  validateApiRequestData,
  maskSensitiveData,
  loginRateLimiter,
  SecuritySession,
  generateCSPHeader,
  SecureStorage,
  SecurityLogger,
};