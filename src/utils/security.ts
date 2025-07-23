/**
 * 보안 관련 유틸리티 함수들
 */

// 타입 정의
type ApiRequestData = Record<string, unknown> | string | number | boolean | null;

interface SecurityLogEntry {
  timestamp: string;
  event: string;
  details: Record<string, unknown>;
  userAgent: string;
  url: string;
  sessionId: string;
}

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 안전한 HTML 렌더링을 위한 새니타이즈
 */
export function sanitizeHtml(html: string): string {
  // 기본적인 태그만 허용
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'span'];
  const allowedAttributes = ['class'];

  // 스크립트 태그 완전 제거
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 이벤트 핸들러 제거
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');

  // javascript: 프로토콜 제거
  sanitized = sanitized.replace(/javascript:/gi, '');

  // data: URL 제거
  sanitized = sanitized.replace(/data:/gi, '');

  return sanitized;
}

/**
 * CSRF 토큰 생성
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 안전한 랜덤 문자열 생성
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * URL 검증 (피싱 방지)
 */
export function validateURL(url: string, allowedDomains?: string[]): boolean {
  try {
    const urlObj = new URL(url);

    // HTTP/HTTPS만 허용
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // 허용된 도메인이 있는 경우 검증
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = urlObj.hostname.toLowerCase();
      return allowedDomains.some(
        (domain) =>
          hostname === domain.toLowerCase() || hostname.endsWith('.' + domain.toLowerCase())
      );
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 사용자 입력 검증 (SQL Injection 방지)
 */
export function validateUserInput(input: string): boolean {
  // SQL 키워드 패턴 검사
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|\\')|(;)|(--\s)|(\|)|(\*)|(%)/,  // -- 뒤에 공백이 있을 때만 SQL 주석으로 인식
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
  ];

  return !sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * API 요청 데이터 검증 (JSON 형태의 데이터용)
 */
export function validateApiRequestData(data: ApiRequestData): boolean {
  // JSON 객체인 경우 개별 값들만 검증
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // URL이나 이메일 등 특정 패턴은 예외 처리
        if (isUrlOrEmail(value)) {
          continue;
        }
        if (!validateUserInput(value)) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (!validateApiRequestData(value as ApiRequestData)) {
          return false;
        }
      }
    }
    return true;
  }
  
  // 문자열인 경우 기본 검증
  return typeof data === 'string' ? validateUserInput(data) : true;
}

/**
 * URL이나 이메일인지 확인하는 헬퍼 함수
 */
function isUrlOrEmail(value: string): boolean {
  const urlPattern = /^https?:\/\/.+/i;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return urlPattern.test(value) || emailPattern.test(value);
}

/**
 * 민감한 정보 마스킹
 */
export function maskSensitiveData(
  data: string,
  type: 'email' | 'phone' | 'card' | 'password'
): string {
  switch (type) {
    case 'email':
      const emailParts = data.split('@');
      if (emailParts.length !== 2) return data;
      const [user, domain] = emailParts;
      const maskedUser =
        user && user.length > 2 ? user.substring(0, 2) + '*'.repeat(user.length - 2) : user || '';
      return `${maskedUser}@${domain}`;

    case 'phone':
      return data.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');

    case 'card':
      return data.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-****-****-$4');

    case 'password':
      return '*'.repeat(data.length);

    default:
      return data;
  }
}

/**
 * 로그인 시도 제한을 위한 레이트 리미터
 */
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // 시간 윈도우 초과시 리셋
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // 최대 시도 횟수 초과
    if (record.count >= this.maxAttempts) {
      return false;
    }

    // 시도 횟수 증가
    record.count++;
    record.lastAttempt = now;

    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.maxAttempts;

    const now = Date.now();
    if (now - record.lastAttempt > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.count);
  }
}

export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5회 시도, 15분 윈도우

/**
 * 세션 관리
 */
export class SecuritySession {
  private static readonly SESSION_KEY = 'krgeobuk_session';
  private static readonly CSRF_KEY = 'krgeobuk_csrf';

  static generateSession(): string {
    const sessionId = generateSecureRandomString(64);
    const csrf = generateCSRFToken();

    // 세션 정보를 안전하게 저장
    const sessionData = {
      id: sessionId,
      csrf,
      timestamp: Date.now(),
      fingerprint: this.generateFingerprint(),
    };

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(this.CSRF_KEY, csrf);

    return sessionId;
  }

  static getCSRFToken(): string | null {
    return sessionStorage.getItem(this.CSRF_KEY);
  }

  static validateSession(): boolean {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return false;

      const parsed = JSON.parse(sessionData);
      const now = Date.now();

      // 세션 만료 확인 (24시간)
      if (now - parsed.timestamp > 24 * 60 * 60 * 1000) {
        this.clearSession();
        return false;
      }

      // 브라우저 핑거프린트 검증
      if (parsed.fingerprint !== this.generateFingerprint()) {
        this.clearSession();
        return false;
      }

      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.CSRF_KEY);
  }

  private static generateFingerprint(): string {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
    ].join('|');

    // 간단한 해시 함수
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit 정수로 변환
    }

    return hash.toString(36);
  }
}

/**
 * Content Security Policy 헤더 생성
 */
export function generateCSPHeader(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 개발용, 프로덕션에서는 제거
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.krgeobuk.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return directives.join('; ');
}

/**
 * 안전한 로컬 스토리지 래퍼
 */
export class SecureStorage {
  private static readonly PREFIX = 'krgeobuk_';

  static setItem(key: string, value: string, encrypt: boolean = false): void {
    try {
      const finalKey = this.PREFIX + key;
      const finalValue = encrypt ? this.encrypt(value) : value;
      localStorage.setItem(finalKey, finalValue);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  }

  static getItem(key: string, decrypt: boolean = false): string | null {
    try {
      const finalKey = this.PREFIX + key;
      const value = localStorage.getItem(finalKey);
      if (!value) return null;

      return decrypt ? this.decrypt(value) : value;
    } catch (error) {
      console.error('Failed to read from secure storage:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    const finalKey = this.PREFIX + key;
    localStorage.removeItem(finalKey);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  private static encrypt(value: string): string {
    // 간단한 Base64 인코딩 (실제 환경에서는 더 강력한 암호화 사용)
    return btoa(encodeURIComponent(value));
  }

  private static decrypt(value: string): string {
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return value;
    }
  }
}

/**
 * 보안 로깅
 */
export class SecurityLogger {
  static logSecurityEvent(event: string, details: Record<string, unknown> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: SecuritySession.validateSession() ? 'valid' : 'invalid',
    };

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', logEntry);
    }

    // 프로덕션에서는 서버로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityEndpoint(logEntry);
    }
  }

  private static async sendToSecurityEndpoint(logEntry: SecurityLogEntry): Promise<void> {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': SecuritySession.getCSRFToken() || '',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // 보안 로깅 실패는 사용자에게 노출하지 않음
      console.error('Failed to log security event:', error);
    }
  }
}

export default {
  escapeHtml,
  sanitizeHtml,
  generateCSRFToken,
  generateSecureRandomString,
  validateURL,
  validateUserInput,
  maskSensitiveData,
  loginRateLimiter,
  SecuritySession,
  generateCSPHeader,
  SecureStorage,
  SecurityLogger,
};

