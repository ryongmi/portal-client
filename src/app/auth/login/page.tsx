'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { loginUser } from '@/store/slices/authSlice';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  SecuritySession,
  SecurityLogger,
  loginRateLimiter,
  validateUserInput,
  escapeHtml,
} from '@/utils/security';

export default function LoginPage(): JSX.Element {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [redirectSession, setRedirectSession] = useState<string | null>(null);
  const [isSSO, setIsSSO] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // 보안 초기화 및 SSO 리다이렉트 세션 확인
  useEffect(() => {
    // 세션 초기화
    if (!SecuritySession.validateSession()) {
      SecuritySession.generateSession();
    }

    // Rate limiting 상태 확인
    const clientId = navigator.userAgent + window.location.hostname;
    const remaining = loginRateLimiter.getRemainingAttempts(clientId);
    setRemainingAttempts(remaining);
    setIsBlocked(remaining === 0);

    // SSO 세션 확인
    const session = searchParams.get('redirect-session');
    if (session) {
      // 세션 ID 유효성 검증
      if (!/^[a-zA-Z0-9_-]{20,}$/.test(session)) {
        SecurityLogger.logSecurityEvent('INVALID_SSO_SESSION', {
          session: session.substring(0, 10) + '...',
          userAgent: navigator.userAgent,
        });
        setErrors({ submit: '잘못된 SSO 세션입니다.' });
        return;
      }

      setRedirectSession(session);
      setIsSSO(true);

      SecurityLogger.logSecurityEvent('SSO_LOGIN_ATTEMPT', {
        session: session.substring(0, 10) + '...',
        referrer: document.referrer,
      });
    }

    // 보안 이벤트 리스너
    const handleVisibilityChange = () => {
      if (document.hidden) {
        SecurityLogger.logSecurityEvent('LOGIN_PAGE_HIDDEN', {
          timestamp: Date.now(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 입력 값 보안 검증
    if (!validateUserInput(value)) {
      SecurityLogger.logSecurityEvent('SUSPICIOUS_LOGIN_INPUT', {
        field: name,
        value: value.substring(0, 20) + '...',
        userAgent: navigator.userAgent,
      });
      setErrors((prev) => ({
        ...prev,
        [name]: '잘못된 입력입니다.',
      }));
      return;
    }

    // 이메일 필드 추가 보안 검증
    if (name === 'email' && value.length > 0) {
      // SQL Injection 패턴 감지
      const suspiciousPatterns = [
        /['"]/g,
        /union\s+select/i,
        /or\s+1\s*=\s*1/i,
        /<script/i,
        /javascript:/i,
      ];

      if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
        SecurityLogger.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
          field: name,
          value: value.substring(0, 50),
          userAgent: navigator.userAgent,
          ip: 'client-side',
        });
        setErrors((prev) => ({
          ...prev,
          [name]: '잘못된 입력 형식입니다.',
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: escapeHtml(value.trim()),
    }));

    // 입력 시 에러 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Honeypot 검사 (봇 탐지)
    if (honeypotRef.current?.value) {
      SecurityLogger.logSecurityEvent('BOT_DETECTED', {
        honeypot: honeypotRef.current.value,
        userAgent: navigator.userAgent,
      });
      newErrors.submit = '비정상적인 요청이 감지되었습니다.';
      return false;
    }

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else {
      // 이메일 형식 검증 (더 엄격한 범위)
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식을 입력해주세요';
      } else if (formData.email.length > 254) {
        newErrors.email = '이메일 주소가 너무 깁니다';
      }
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
    } else if (formData.password.length > 128) {
      newErrors.password = '비밀번호가 너무 깁니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting 검사
    const clientId = navigator.userAgent + window.location.hostname;
    if (!loginRateLimiter.isAllowed(clientId)) {
      setIsBlocked(true);
      setRemainingAttempts(0);
      SecurityLogger.logSecurityEvent('LOGIN_RATE_LIMITED', {
        clientId: clientId.substring(0, 50),
        attempts: loginAttempts + 1,
      });
      setErrors({
        submit: '너무 많은 로그인 시도로 일시적으로 차단되었습니다. 15분 후에 다시 시도해주세요.',
      });
      return;
    }

    if (!validateForm()) return;

    // CSRF 토큰 검증
    const csrfToken = SecuritySession.getCSRFToken();
    if (!csrfToken) {
      SecurityLogger.logSecurityEvent('MISSING_CSRF_TOKEN', {
        userAgent: navigator.userAgent,
      });
      setErrors({ submit: '보안 토큰이 누락되었습니다. 페이지를 새로고침해주세요.' });
      return;
    }

    setIsLoading(true);
    setLoginAttempts((prev) => prev + 1);

    SecurityLogger.logSecurityEvent('LOGIN_ATTEMPT', {
      email: formData.email.substring(0, 3) + '***',
      isSSO,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    try {
      if (isSSO && redirectSession) {
        // SSO 로그인 처리 - 백엔드에서 리다이렉트 처리
        const url = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/auth/login?redirect-session=${redirectSession}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
          redirect: 'manual', // 리다이렉트 수동 처리
          credentials: 'include', // 쿠키 포함
        });

        if (response.status === 0 || response.type === 'opaqueredirect') {
          // 백엔드에서 리다이렉트 처리됨 (SSO)
          window.location.reload();
        } else if (response.status === 302) {
          // 리다이렉트 응답
          const location = response.headers.get('Location');
          if (location) {
            window.location.href = location;
          }
        } else {
          // 응답 처리
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || '로그인에 실패했습니다.');
          }
        }
      } else {
        // 일반 로그인 처리
        await dispatch(
          loginUser({
            email: formData.email,
            password: formData.password,
            // csrfToken
          })
        ).unwrap();

        // 로그인 성공 로깅
        SecurityLogger.logSecurityEvent('LOGIN_SUCCESS', {
          email: formData.email.substring(0, 3) + '***',
          timestamp: Date.now(),
        });

        // Rate limit 리셋
        loginRateLimiter.reset(clientId);

        router.push('/');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
          ? error.message
          : undefined;

      // 로그인 실패 로깅
      SecurityLogger.logSecurityEvent('LOGIN_FAILURE', {
        email: formData.email.substring(0, 3) + '***',
        error: errorMessage || 'Unknown error',
        attempts: loginAttempts,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });

      // 남은 시도 횟수 업데이트
      const remaining = loginRateLimiter.getRemainingAttempts(clientId);
      setRemainingAttempts(remaining);

      if (remaining === 0) {
        setIsBlocked(true);
        setErrors({
          submit: '너무 많은 로그인 시도로 일시적으로 차단되었습니다. 15분 후에 다시 시도해주세요.',
        });
      } else {
        setErrors({
          submit: `${errorMessage || '로그인에 실패했습니다.'} (남은 시도: ${remaining}회)`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 로그인 처리
  const handleGoogleLogin = async () => {
    try {
      // Google OAuth URL로 리다이렉트 (redirect-session 포함)
      const googleAuthUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/oauth/login-google${
        redirectSession ? `?redirect-session=${redirectSession}` : ''
      }`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      setErrors({
        submit: '구글 로그인에 실패했습니다. 다시 시도해주세요.',
      });
    }
  };

  // 네이버 로그인 처리
  const handleNaverLogin = async () => {
    try {
      // Naver OAuth URL로 리다이렉트 (redirect-session 포함)
      const naverAuthUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/oauth/login-naver${
        redirectSession ? `?redirect-session=${redirectSession}` : ''
      }`;
      window.location.href = naverAuthUrl;
    } catch (error) {
      console.error('네이버 로그인 실패:', error);
      setErrors({
        submit: '네이버 로그인에 실패했습니다. 다시 시도해주세요.',
      });
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 헤더 */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
                KRGeobuk Portal
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-700 mb-2">로그인</h2>
            <p className="text-gray-500">계정에 로그인하여 서비스를 이용하세요</p>
          </div>

          {/* SSO 알림 */}
          {isSSO && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  <strong>다른 서비스</strong>에서 로그인을 요청했습니다. 로그인 후 자동으로
                  이동됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 로그인 폼 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot 필드 (봇 탐지용) */}
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />
              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                  이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
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
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
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
                    {errors.password}
                  </p>
                )}
              </div>

              {/* 로그인 유지 및 비밀번호 찾기 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    로그인 유지
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="text-blue-500 hover:text-blue-400 transition-colors">
                    비밀번호를 잊으셨나요?
                  </a>
                </div>
              </div>

              {/* 제출 에러 */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Rate Limit 경고 */}
              {remainingAttempts <= 2 && remainingAttempts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-600 mr-2"
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
                    <p className="text-sm text-yellow-800">
                      <strong>경고:</strong> 남은 로그인 시도 횟수: {remainingAttempts}회
                    </p>
                  </div>
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading || isBlocked}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isBlocked ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                      />
                    </svg>
                    일시적으로 차단됨
                  </>
                ) : isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    로그인
                  </>
                )}
              </button>
            </form>

            {/* 구분선 */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>
            </div>

            {/* 소셜 로그인 버튼 */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isBlocked}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인
              </button>

              <button
                type="button"
                onClick={handleNaverLogin}
                disabled={isBlocked}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#03C75A"
                    d="M16.273 12.845 7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z"
                  />
                </svg>
                Naver로 로그인
              </button>
            </div>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                아직 계정이 없으신가요?{' '}
                <Link
                  href="/auth/register"
                  className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

