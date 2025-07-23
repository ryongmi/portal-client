import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보안 헤더 설정
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 개발용, 프로덕션에서는 제거 필요
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://localhost:8000 https://localhost:8100 https://localhost:8200 https://*.krgeobuk.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "manifest-src 'self'",
  ].join('; '),

  // XSS 방지
  'X-XSS-Protection': '1; mode=block',

  // MIME 타입 스니핑 방지
  'X-Content-Type-Options': 'nosniff',

  // 클릭재킹 방지
  'X-Frame-Options': 'DENY',

  // Referrer 정책
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // HTTPS 강제 (프로덕션에서만)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),

  // 권한 정책
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // 교차 출처 정책
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// 민감한 경로들
const sensitiveRoutes = ['/admin', '/auth'];

// Rate Limiting을 위한 간단한 메모리 저장소
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function rateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  // 윈도우 시간이 지나면 리셋
  if (current.lastReset < windowStart) {
    current.count = 0;
    current.lastReset = now;
  }

  current.count++;
  rateLimitMap.set(ip, current);

  return current.count <= maxRequests;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Rate Limiting 적용
  if (!rateLimit(ip, 100, 60000)) {
    // 1분에 100요청
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        ...securityHeaders,
      },
    });
  }

  // 보안 헤더 적용
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CSRF 토큰 검증 (POST, PUT, DELETE 요청)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token');
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');

    // API 요청이 아닌 경우에만 CSRF 검증
    if (!pathname.startsWith('/api/')) {
      // Origin/Referer 검증
      const allowedOrigins = [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXTAUTH_URL,
      ].filter(Boolean);

      const isValidOrigin = allowedOrigins.some(
        (allowed) => origin === allowed || referer?.startsWith(allowed + '/')
      );

      if (!isValidOrigin) {
        console.warn('Invalid origin/referer:', { origin, referer, pathname });
        return new NextResponse('Forbidden', {
          status: 403,
          headers: securityHeaders,
        });
      }
    }
  }

  // 민감한 경로에 대한 추가 보안 검사
  if (sensitiveRoutes.some((route) => pathname.startsWith(route))) {
    // User-Agent 검증 (기본적인 봇 차단)
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];

    if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
      return new NextResponse('Forbidden', {
        status: 403,
        headers: securityHeaders,
      });
    }

    // 추가 보안 헤더
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // 개발 환경에서는 더 관대한 CSP 적용
  if (process.env.NODE_ENV === 'development') {
    const devCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', devCSP);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

