// auth-server/src/auth/auth.controller.ts
// 이 파일은 참고용 예시입니다. 실제 auth-server에서 구현해야 합니다.

import { Controller, Get, Post, Body, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService
  ) {}

  /**
   * SSO 로그인 시작점
   * 다른 서비스에서 redirect_uri와 함께 호출
   */
  @Get('login')
  async redirectToLogin(@Query('redirect_uri') redirectUri: string, @Res() res: Response) {
    // 리다이렉트 URI 검증
    const isValidRedirect = await this.authService.validateRedirectUri(redirectUri);
    if (!isValidRedirect) {
      throw new BadRequestException('Invalid redirect URI');
    }

    // 리다이렉트 세션 생성
    const redirectSession = uuid();
    await this.redisService.set(
      `redirect_session:${redirectSession}`,
      JSON.stringify({
        redirectUri,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분
      }),
      300 // 5분 TTL
    );

    // Portal Client로 리다이렉트 (redirect_session 포함)
    const portalLoginUrl = `${process.env.PORTAL_CLIENT_URL}/auth/login?redirect_session=${redirectSession}`;
    res.redirect(portalLoginUrl);
  }

  /**
   * 이메일/비밀번호 로그인
   * portal-client에서 호출
   */
  @Post('login')
  async login(
    @Body() loginData: LoginDto,
    @Query('redirect_session') redirectSession: string,
    @Res() res: Response
  ) {
    try {
      // 로그인 처리
      const tokens = await this.authService.login(loginData);

      // SSO 리다이렉트 세션 확인
      if (redirectSession) {
        const sessionData = await this.redisService.get(`redirect_session:${redirectSession}`);

        if (sessionData) {
          const { redirectUri } = JSON.parse(sessionData);

          // 세션 정리
          await this.redisService.del(`redirect_session:${redirectSession}`);

          // 원래 서비스로 리다이렉트 (토큰 포함)
          const callbackUrl = `${redirectUri}?token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
          res.redirect(callbackUrl);
          return;
        }
      }

      // 일반 로그인 응답 (포털 사용)
      res.json({
        code: 'AUTH_LOGIN_SUCCESS',
        statusCode: 200,
        message: '로그인 성공',
        data: tokens,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 구글 OAuth 시작
   * portal-client에서 호출
   */
  @Get('google')
  async googleLogin(@Query('redirect_session') redirectSession: string, @Res() res: Response) {
    // OAuth state 생성 (CSRF 방지용)
    const oauthState = uuid();

    // OAuth state와 SSO redirect session 연결
    if (redirectSession) {
      await this.redisService.set(
        `oauth_state:${oauthState}`,
        JSON.stringify({ redirectSession }),
        300 // 5분
      );
    }

    // Google OAuth URL 생성
    const googleAuthUrl =
      `https://accounts.google.com/oauth/authorize?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `state=${oauthState}`;

    res.redirect(googleAuthUrl);
  }

  /**
   * 구글 OAuth 콜백
   * Google에서 호출
   */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') oauthState: string,
    @Res() res: Response
  ) {
    try {
      // Google OAuth 처리
      const tokens = await this.authService.handleGoogleCallback(code, oauthState);

      // OAuth state에서 SSO redirect session 확인
      const stateData = await this.redisService.get(`oauth_state:${oauthState}`);

      if (stateData) {
        const { redirectSession } = JSON.parse(stateData);

        // SSO redirect session 확인
        const sessionData = await this.redisService.get(`redirect_session:${redirectSession}`);

        if (sessionData) {
          const { redirectUri } = JSON.parse(sessionData);

          // 세션 정리
          await this.redisService.del(`oauth_state:${oauthState}`);
          await this.redisService.del(`redirect_session:${redirectSession}`);

          // 원래 서비스로 리다이렉트 (토큰 포함)
          const callbackUrl = `${redirectUri}?token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
          res.redirect(callbackUrl);
          return;
        }
      }

      // 일반 구글 로그인 (포털 사용)
      const callbackUrl = `${process.env.PORTAL_CLIENT_URL}/auth/callback?token=${tokens.accessToken}`;
      res.redirect(callbackUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.PORTAL_CLIENT_URL}/auth/login?error=google_auth_failed`);
    }
  }
}

// auth-server/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  /**
   * 리다이렉트 URI 검증
   */
  async validateRedirectUri(redirectUri: string): Promise<boolean> {
    const allowedDomains = [
      'localhost',
      'krgeobuk.com',
      'service1.krgeobuk.com',
      'service2.krgeobuk.com',
      // 허용된 도메인들 추가
    ];

    try {
      const url = new URL(redirectUri);
      const hostname = url.hostname;

      // 허용된 도메인 확인
      return allowedDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * 이메일/비밀번호 로그인
   */
  async login(loginData: LoginDto) {
    // 로그인 로직 구현
    // 사용자 검증, 토큰 생성 등

    return {
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      expiresIn: 3600,
    };
  }

  /**
   * 구글 OAuth 콜백 처리
   */
  async handleGoogleCallback(code: string, state: string) {
    // Google OAuth 토큰 교환
    // 사용자 정보 조회
    // JWT 토큰 생성

    return {
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      expiresIn: 3600,
    };
  }
}

// 다른 서비스에서 SSO 연동 예시
// other-service/src/auth/sso.service.ts
export class SSOService {
  /**
   * SSO 로그인 시작
   */
  redirectToSSO() {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/sso/callback`);
    const ssoUrl = `${process.env.AUTH_SERVER_URL}/auth/login?redirect_uri=${redirectUri}`;
    window.location.href = ssoUrl;
  }
}

// other-service/src/auth/sso/callback/page.tsx
export default function SSOCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const refreshToken = urlParams.get('refresh_token');

      if (token) {
        // 토큰 저장
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // 사용자 정보 조회 및 앱 상태 업데이트
        await refreshUserInfo();

        // 메인 페이지로 이동
        router.push('/dashboard');
      } else {
        // 에러 처리
        router.push('/auth/login?error=sso_failed');
      }
    };

    handleCallback();
  }, []);

  return <div>SSO 로그인 처리 중...</div>;
}
