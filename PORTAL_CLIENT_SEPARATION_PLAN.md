# Portal Client 분리 계획서

## 📋 개요

portal-client를 사용자 포털과 관리자 포털로 분리하여 보안성, 성능, 유지보수성을 향상시키는 프로젝트입니다. 현재 하나의 애플리케이션에서 라우팅으로 구분되어 있는 구조를 독립적인 두 개의 애플리케이션으로 분리합니다.

### 목표
- **보안 강화**: 관리자 기능의 완전한 분리로 보안 경계 강화
- **성능 최적화**: 각 사용자 그룹에 최적화된 번들 크기 및 기능
- **개발 효율성**: 독립적인 개발, 배포, 확장 가능
- **사용자 경험**: 각 사용자 그룹에 특화된 UX 제공

## 🔍 현재 상태 분석

### 프로젝트 구조 현황
```
portal-client/
├── src/
│   ├── app/
│   │   ├── admin/          # 관리자 페이지 (분리 대상)
│   │   ├── auth/           # 인증 페이지 (공통 → SSO로 이관)
│   │   ├── layout.tsx      # 루트 레이아웃 (분리 필요)
│   │   └── page.tsx        # 메인 페이지 (사용자 전용)
│   ├── components/
│   │   ├── common/         # 공통 UI 컴포넌트 (공유 라이브러리화)
│   │   ├── forms/          # 폼 컴포넌트 (부분 공유)
│   │   ├── layout/         # 레이아웃 컴포넌트 (분리 필요)
│   │   ├── dashboard/      # 대시보드 컴포넌트 (사용자 전용)
│   │   ├── modals/         # 모달 컴포넌트 (부분 공유)
│   │   └── profile/        # 프로필 컴포넌트 (사용자 전용)
│   ├── hooks/              # 커스텀 훅 (부분 공유)
│   ├── services/           # API 서비스 (부분 공유)
│   ├── store/              # Redux 상태 관리 (분리 필요)
│   ├── types/              # 타입 정의 (공유 라이브러리화)
│   └── utils/              # 유틸리티 (공유 라이브러리화)
```

### 기능별 분류

#### 🟢 사용자 포털 기능 (portal.krgeobuk.com)
- **메인 대시보드**: 서비스 개요, 통계, 개인화된 정보
- **프로필 관리**: 개인 정보 수정, 설정 관리
- **서비스 접근**: 연결된 서비스들로의 SSO 접근
- **알림 관리**: 개인 알림, 시스템 공지사항
- **도움말**: 사용자 가이드, FAQ

**대상 사용자**: 일반 사용자, 서비스 이용자

#### 🔴 관리자 포털 기능 (portal-admin.krgeobuk.com)
- **사용자 관리**: 사용자 CRUD, 상태 관리, 권한 부여
- **OAuth 관리**: OAuth 클라이언트 등록, 설정, 모니터링
- **역할 관리**: 역할 생성, 수정, 삭제, 권한 매핑
- **권한 관리**: 권한 정의, 분류, 역할 연결
- **서비스 관리**: 서비스 등록, 가시성 설정, 상태 모니터링
- **시스템 관리**: 로그 조회, 통계, 설정

**대상 사용자**: 시스템 관리자, 운영진

#### 🟡 공통 기능 (공유 라이브러리화)
- **UI 컴포넌트**: Button, Card, Input, Modal, Table 등
- **인증 시스템**: SSO 연동, 토큰 관리 (auth.krgeobuk.com으로 이관)
- **API 클라이언트**: HTTP 클라이언트, 인터셉터, 에러 처리
- **타입 정의**: 공통 인터페이스, 응답 타입
- **유틸리티**: 케이스 변환, 폼 검증, 보안 함수

## 📦 공유 라이브러리 설계

### @krgeobuk/portal-ui
```typescript
// 포털 전용 UI 컴포넌트 라이브러리
export {
  // 공통 UI 컴포넌트
  Button,
  Card,
  Input,
  Modal,
  Table,
  LoadingSpinner,
  ErrorMessage,
  Toast,
  
  // 레이아웃 컴포넌트
  Layout,
  Header,
  Sidebar,
  
  // 폼 컴포넌트
  FormField,
  SearchFilters,
  Pagination,
  
  // 특화 컴포넌트
  StatsCard,
  ActivityFeed,
  UserProfileCard,
} from './components';

export * from './types/ui';
export * from './hooks/ui';
```

### @krgeobuk/portal-common
```typescript
// 포털 공통 타입, 인터페이스, 유틸리티
export type {
  // API 응답 타입
  ApiResponse,
  PaginatedResponse,
  PageInfo,
  
  // 도메인 모델
  User,
  Role,
  Permission,
  Service,
  OAuthClient,
  
  // 폼 데이터 타입
  LoginFormData,
  UserFormData,
  RoleFormData,
  PermissionFormData,
} from './types';

export {
  // 유틸리티 함수
  caseConverter,
  formValidation,
  security,
  dateUtils,
  
  // 상수 및 열거형
  API_ENDPOINTS,
  ERROR_CODES,
  USER_ROLES,
  PERMISSIONS,
} from './utils';
```

### @krgeobuk/portal-api
```typescript
// 포털 API 서비스 클라이언트
export {
  // HTTP 클라이언트
  apiClient,
  
  // 서비스별 API
  userService,
  roleService,
  permissionService,
  serviceService,
  oauthService,
  
  // 인증 관련 (SSO 통합)
  authService,
} from './services';

export type {
  // API 요청/응답 타입
  ApiRequest,
  ApiResponse,
  ServiceResponse,
} from './types';
```

## 🏗️ 분리 전략

### Phase 1: 공유 라이브러리 생성 (2-3주)

#### 1.1 @krgeobuk/portal-ui 패키지 생성
```bash
# shared-lib/packages/portal-ui 생성
cd shared-lib/packages
mkdir portal-ui
cd portal-ui

# 패키지 초기화
npm init -y
```

**이전할 컴포넌트들**:
```typescript
// components/common/ → @krgeobuk/portal-ui
- Button.tsx
- Card.tsx  
- Input.tsx
- Modal.tsx
- Table.tsx
- LoadingSpinner.tsx
- LoadingOverlay.tsx
- ErrorMessage.tsx
- Toast.tsx
- ToastContainer.tsx
- ProgressBar.tsx
- SkeletonLoader.tsx

// components/layout/ → @krgeobuk/portal-ui  
- Layout.tsx
- Header.tsx
- Sidebar.tsx

// components/dashboard/ → @krgeobuk/portal-ui
- StatsCard.tsx
- ChartCard.tsx
- ActivityFeed.tsx
- SystemHealthCard.tsx

// components/profile/ → @krgeobuk/portal-ui
- UserProfileCard.tsx
```

#### 1.2 @krgeobuk/portal-common 패키지 생성
```typescript
// types/index.ts → @krgeobuk/portal-common/types
- API 응답 타입 (ApiResponse, PaginatedResponse)
- 도메인 모델 (User, Role, Permission, Service)
- 폼 데이터 타입
- 공통 인터페이스

// utils/ → @krgeobuk/portal-common/utils  
- caseConverter.ts
- formValidation.ts
- security.ts
- 상수 및 열거형
```

#### 1.3 @krgeobuk/portal-api 패키지 생성
```typescript
// services/ → @krgeobuk/portal-api
- userService.ts
- roleService.ts  
- permissionService.ts
- serviceService.ts
- oauthService.ts
- authService.ts (SSO 통합용)

// lib/httpClient.ts → @krgeobuk/portal-api
- Axios 설정
- 인터셉터 로직
- 에러 처리
```

### Phase 2: 관리자 포털 분리 (3-4주)

#### 2.1 portal-admin 프로젝트 생성
```bash
# 프로젝트 루트에서
npx create-next-app@latest portal-admin --typescript --tailwind --eslint --app --src-dir

cd portal-admin
```

#### 2.2 관리자 기능 이전
```typescript
// src/app/admin/ → portal-admin/src/app/
├── page.tsx                    # 관리자 대시보드
├── auth/
│   ├── users/page.tsx         # 사용자 관리
│   └── oauth/page.tsx         # OAuth 관리
├── authorization/
│   ├── roles/page.tsx         # 역할 관리
│   └── permissions/page.tsx   # 권한 관리
└── portal/
    └── services/page.tsx      # 서비스 관리
```

#### 2.3 관리자 전용 컴포넌트 이전
```typescript
// components/forms/ → portal-admin/src/components/forms/
- RoleForm.tsx
- PermissionForm.tsx
- UserEditForm.tsx (관리자용)
- ServiceForm.tsx

// components/modals/ → portal-admin/src/components/modals/  
- RolePermissionModal.tsx
- UserDetailModal.tsx (관리자용)
- ServiceConfigModal.tsx

// 관리자 전용 새 컴포넌트
- AdminDashboard.tsx
- UserManagementTable.tsx
- RoleHierarchyTree.tsx
- PermissionMatrix.tsx
- ServiceStatusMonitor.tsx
```

#### 2.4 관리자 전용 훅 및 서비스
```typescript
// hooks/ → portal-admin/src/hooks/
- useUsers.ts (관리자용)
- useRoles.ts
- usePermissions.ts
- useServices.ts
- useOAuth.ts

// store/ → portal-admin/src/store/
- adminSlice.ts
- userManagementSlice.ts
- roleSlice.ts
- permissionSlice.ts
- serviceSlice.ts
```

#### 2.5 보안 강화 설정
```typescript
// portal-admin/src/middleware.ts
export function middleware(request: NextRequest) {
  // 관리자 권한 검증
  const token = request.cookies.get('krgeobuk_auth_token');
  
  if (!token) {
    return NextResponse.redirect(new URL('https://auth.krgeobuk.com/login', request.url));
  }
  
  // JWT 토큰에서 관리자 권한 확인
  const payload = jwt.verify(token.value, process.env.JWT_PUBLIC_KEY);
  const hasAdminRole = payload.roles?.includes('admin') || payload.roles?.includes('super_admin');
  
  if (!hasAdminRole) {
    return NextResponse.redirect(new URL('https://portal.krgeobuk.com', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Phase 3: 사용자 포털 정리 (2-3주)

#### 3.1 관리자 기능 완전 제거
```bash
# 제거할 파일들
rm -rf src/app/admin/
rm -rf src/components/forms/RoleForm.tsx
rm -rf src/components/forms/PermissionForm.tsx  
rm -rf src/components/modals/RolePermissionModal.tsx
rm -rf src/store/slices/roleSlice.ts
rm -rf src/store/slices/permissionSlice.ts
rm -rf src/hooks/useRoles.ts
rm -rf src/hooks/usePermissions.ts
```

#### 3.2 공유 라이브러리 의존성 추가
```json
// portal-client/package.json
{
  "dependencies": {
    "@krgeobuk/portal-ui": "workspace:*",
    "@krgeobuk/portal-common": "workspace:*", 
    "@krgeobuk/portal-api": "workspace:*",
    "next": "15.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### 3.3 Import 경로 업데이트
```typescript
// Before
import { Button } from '@/components/common/Button';
import { User } from '@/types';
import { userService } from '@/services/userService';

// After  
import { Button } from '@krgeobuk/portal-ui';
import { User } from '@krgeobuk/portal-common';
import { userService } from '@krgeobuk/portal-api';
```

#### 3.4 사용자 전용 기능 최적화
```typescript
// 사용자 대시보드 최적화
const UserDashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* 개인화된 서비스 목록 */}
        <ServiceGrid services={userServices} />
        
        {/* 최근 활동 */}
        <ActivityFeed activities={recentActivities} />
        
        {/* 개인 통계 */}
        <UserStats stats={userStats} />
        
        {/* 빠른 액세스 */}
        <QuickAccess shortcuts={userShortcuts} />
      </div>
    </Layout>
  );
};
```

### Phase 4: SSO 통합 (2주)

#### 4.1 인증 로직 SSO로 교체
```typescript
// portal-client/src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 쿠키에서 JWT 토큰 확인
    const token = getCookie('krgeobuk_auth_token');
    
    if (!token) {
      // auth.krgeobuk.com으로 리다이렉트
      const redirectUri = encodeURIComponent(window.location.href);
      window.location.href = `https://auth.krgeobuk.com/login?redirect_uri=${redirectUri}`;
      return;
    }
    
    // 토큰 유효성 검증 및 사용자 정보 로드
    validateTokenAndLoadUser(token);
  }, []);
  
  const validateTokenAndLoadUser = async (token: string) => {
    try {
      const payload = jwt.decode(token);
      
      // 토큰 만료 확인
      if (payload.exp < Date.now() / 1000) {
        await refreshToken();
        return;
      }
      
      // 사용자 정보 로드
      const userData = await userService.getProfile();
      setUser(userData);
    } catch (error) {
      // 토큰 무효 시 재인증
      redirectToAuth();
    } finally {
      setLoading(false);
    }
  };
  
  return { user, loading, logout: handleLogout };
};
```

#### 4.2 관리자 포털 SSO 통합
```typescript
// portal-admin/src/hooks/useAdminAuth.ts
export const useAdminAuth = () => {
  const { user, loading } = useAuth();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  
  useEffect(() => {
    if (user) {
      // 관리자 권한 확인
      const adminRoles = ['admin', 'super_admin', 'moderator'];
      const userRoles = user.roles || [];
      const hasAdmin = adminRoles.some(role => userRoles.includes(role));
      
      if (!hasAdmin) {
        // 권한 없음 - 사용자 포털로 리다이렉트
        window.location.href = 'https://portal.krgeobuk.com';
        return;
      }
      
      setHasAdminAccess(true);
    }
  }, [user]);
  
  return { user, loading, hasAdminAccess };
};
```

## 🔧 기술적 구현 세부사항

### Docker 컨테이너 설정

#### portal-client (사용자 포털)
```dockerfile
# portal-client/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# 의존성 설치
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# 빌드
FROM base AS builder  
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# 실행
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### portal-admin (관리자 포털)
```dockerfile
# portal-admin/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# 의존성 설치 (보안 강화된 의존성)
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm audit --audit-level high

# 빌드 (보안 최적화)
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# 관리자 전용 환경 변수 설정
ENV NEXT_PUBLIC_ADMIN_MODE=true
ENV NEXT_PUBLIC_SECURITY_LEVEL=high

RUN npm run build

# 실행 (보안 강화)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 보안 강화된 파일 권한 설정
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT 3001

CMD ["node", "server.js"]
```

### 환경 변수 설정

#### 사용자 포털 환경 변수
```bash
# portal-client/.env.production
NEXT_PUBLIC_DOMAIN=portal.krgeobuk.com
NEXT_PUBLIC_AUTH_URL=https://auth.krgeobuk.com
NEXT_PUBLIC_API_URL=https://api.krgeobuk.com
NEXT_PUBLIC_CDN_URL=https://cdn.krgeobuk.com
NEXT_PUBLIC_USER_MODE=true

# JWT 검증용 공개 키
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."

# API 서버 내부 통신
INTERNAL_API_URL=http://api-server:8000
INTERNAL_AUTH_URL=http://auth-server:8000
```

#### 관리자 포털 환경 변수
```bash
# portal-admin/.env.production
NEXT_PUBLIC_DOMAIN=portal-admin.krgeobuk.com
NEXT_PUBLIC_AUTH_URL=https://auth.krgeobuk.com  
NEXT_PUBLIC_API_URL=https://api.krgeobuk.com
NEXT_PUBLIC_ADMIN_MODE=true
NEXT_PUBLIC_SECURITY_LEVEL=high

# 관리자 전용 설정
ADMIN_API_TIMEOUT=30000
ADMIN_SESSION_TIMEOUT=1800
ENABLE_AUDIT_LOG=true

# JWT 검증용 공개 키
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."

# 관리자 API 내부 통신
INTERNAL_ADMIN_API_URL=http://authz-server:8100
INTERNAL_AUTH_API_URL=http://auth-server:8000
```

### 보안 강화 설정

#### Content Security Policy
```typescript
// portal-client/next.config.mjs (사용자 포털)
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://cdn.krgeobuk.com",
              "connect-src 'self' https://api.krgeobuk.com https://auth.krgeobuk.com",
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};
```

```typescript
// portal-admin/next.config.mjs (관리자 포털 - 더 엄격)
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",  // inline 스크립트 금지
              "style-src 'self' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com", 
              "img-src 'self' data:",
              "connect-src 'self' https://api.krgeobuk.com https://auth.krgeobuk.com",
              "frame-src 'none'",   // iframe 완전 금지
              "object-src 'none'"   // object 태그 금지
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

## 📊 성능 최적화 전략

### 번들 크기 최적화

#### 사용자 포털 최적화
```typescript
// portal-client에서 불필요한 의존성 제거
// Before (통합 시)
import { RoleManagement } from '@/components/admin/RoleManagement';  // 불필요
import { UserManagement } from '@/components/admin/UserManagement';  // 불필요

// After (분리 후)
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { ServiceGrid } from '@/components/services/ServiceGrid';
```

#### 관리자 포털 최적화
```typescript
// portal-admin에서 필요한 컴포넌트만 import
import { 
  AdminDashboard,
  UserManagementTable,
  RolePermissionMatrix,
  ServiceMonitor 
} from '@/components/admin';

// 지연 로딩 적용
const UserDetailModal = lazy(() => import('@/components/modals/UserDetailModal'));
const RoleEditModal = lazy(() => import('@/components/modals/RoleEditModal'));
```

### 캐싱 전략

#### 사용자 포털 캐싱
```typescript
// 사용자 데이터 캐싱 (더 적극적)
const USER_CACHE_CONFIG = {
  profile: { ttl: 300 },        // 5분
  services: { ttl: 600 },       // 10분  
  notifications: { ttl: 60 },   // 1분
  settings: { ttl: 1800 },      // 30분
};
```

#### 관리자 포털 캐싱
```typescript
// 관리자 데이터 캐싱 (더 보수적)
const ADMIN_CACHE_CONFIG = {
  users: { ttl: 60 },           // 1분 (실시간성 중요)
  roles: { ttl: 300 },          // 5분
  permissions: { ttl: 600 },    // 10분
  services: { ttl: 180 },       // 3분
  auditLogs: { ttl: 0 },        // 캐시 없음
};
```

## 🔍 모니터링 및 로깅

### 서비스별 로그 분리

#### 사용자 포털 로그
```typescript
// portal-client/src/lib/logger.ts
const userLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'portal-user',
    domain: 'portal.krgeobuk.com'
  },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/portal-user.log',
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: '/var/log/portal-user-error.log',
      level: 'error'
    })
  ]
});

// 사용자 행동 로깅
export const logUserAction = (action: string, metadata: any) => {
  userLogger.info('User action', {
    action,
    userId: metadata.userId,
    timestamp: new Date().toISOString(),
    metadata: omitSensitiveData(metadata)
  });
};
```

#### 관리자 포털 로그
```typescript
// portal-admin/src/lib/logger.ts
const adminLogger = winston.createLogger({
  level: 'debug',  // 더 상세한 로깅
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'portal-admin',
    domain: 'portal-admin.krgeobuk.com',
    securityLevel: 'high'
  },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/portal-admin.log',
      level: 'debug'
    }),
    new winston.transports.File({ 
      filename: '/var/log/portal-admin-audit.log',
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: '/var/log/portal-admin-security.log',
      level: 'warn'
    })
  ]
});

// 관리자 행동 감사 로깅
export const logAdminAction = (action: string, metadata: any) => {
  adminLogger.info('Admin action', {
    action,
    adminId: metadata.adminId,
    targetUserId: metadata.targetUserId,
    changes: metadata.changes,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    timestamp: new Date().toISOString()
  });
  
  // 중요한 작업은 별도 보안 로그에도 기록
  if (CRITICAL_ACTIONS.includes(action)) {
    adminLogger.warn('Critical admin action', {
      action,
      adminId: metadata.adminId,
      severity: 'high',
      requiresReview: true
    });
  }
};
```

### 성능 메트릭 수집

#### 사용자 포털 메트릭
```typescript
// 사용자 경험 중심 메트릭
const USER_METRICS = {
  pageLoadTime: 'portal_user_page_load_seconds',
  apiResponseTime: 'portal_user_api_response_seconds', 
  serviceNavigationTime: 'portal_user_service_nav_seconds',
  userSatisfactionScore: 'portal_user_satisfaction_score'
};
```

#### 관리자 포털 메트릭
```typescript
// 운영 효율성 중심 메트릭
const ADMIN_METRICS = {
  adminActionTime: 'portal_admin_action_seconds',
  dataLoadTime: 'portal_admin_data_load_seconds',
  bulkOperationTime: 'portal_admin_bulk_op_seconds',
  securityCheckTime: 'portal_admin_security_check_seconds'
};
```

## 📋 마이그레이션 체크리스트

### Phase 1: 공유 라이브러리 구축
- [ ] @krgeobuk/portal-ui 패키지 생성 및 컴포넌트 이전
- [ ] @krgeobuk/portal-common 패키지 생성 및 타입/유틸리티 이전  
- [ ] @krgeobuk/portal-api 패키지 생성 및 API 서비스 이전
- [ ] 모든 패키지 빌드 성공 및 타입 검사 통과
- [ ] Verdaccio에 패키지 발행 및 테스트

### Phase 2: 관리자 포털 분리
- [ ] portal-admin 프로젝트 생성 (Next.js 15)
- [ ] 관리자 페이지 및 컴포넌트 이전
- [ ] 관리자 전용 상태 관리 구성
- [ ] 공유 라이브러리 의존성 설정
- [ ] 보안 강화 설정 (CSP, 미들웨어)
- [ ] 관리자 권한 검증 로직 구현
- [ ] 독립적인 빌드 및 실행 확인

### Phase 3: 사용자 포털 정리  
- [ ] 기존 portal-client에서 관리자 관련 코드 완전 제거
- [ ] 공유 라이브러리 의존성 설정
- [ ] Import 경로 업데이트 및 코드 정리
- [ ] 사용자 전용 기능 최적화
- [ ] 번들 크기 감소 확인
- [ ] 성능 테스트 및 최적화

### Phase 4: SSO 통합
- [ ] 기존 인증 로직을 SSO 리다이렉트로 교체
- [ ] JWT 토큰 기반 인증 상태 관리
- [ ] 자동 토큰 갱신 로직 구현
- [ ] 크로스 도메인 쿠키 설정 테스트
- [ ] 사용자/관리자 권한 기반 접근 제어
- [ ] 로그아웃 시 모든 도메인에서 토큰 제거

### Phase 5: 배포 및 인프라
- [ ] portal.krgeobuk.com DNS 설정
- [ ] portal-admin.krgeobuk.com DNS 설정
- [ ] Docker 컨테이너 빌드 및 배포
- [ ] 리버스 프록시 라우팅 설정
- [ ] SSL 인증서 적용 및 테스트
- [ ] CDN 설정 및 정적 자산 최적화

### Phase 6: 검증 및 최적화
- [ ] 전체 기능 동작 확인
- [ ] 사용자/관리자 권한 분리 검증
- [ ] 성능 지표 측정 및 최적화
- [ ] 보안 취약점 스캔 및 수정
- [ ] 로그 및 모니터링 시스템 검증
- [ ] 사용자 교육 및 문서 업데이트

### Phase 7: 데이터 마이그레이션 및 정리
- [ ] 기존 사용자 세션 데이터 마이그레이션
- [ ] 북마크 및 설정 데이터 이관
- [ ] 기존 도메인에서 새 도메인으로 리다이렉트 설정
- [ ] 검색엔진 sitemap 업데이트
- [ ] 외부 연동 서비스 URL 변경 통지

## 🎯 성과 지표

### 보안 지표
- [ ] 관리자 기능 완전 분리 (100%)
- [ ] 사용자 포털에서 관리자 API 접근 불가 확인
- [ ] CSP 정책 적용 및 보안 헤더 설정
- [ ] 관리자 행동 감사 로그 100% 수집

### 성능 지표
- [ ] 사용자 포털 번들 크기 40% 이상 감소
- [ ] 관리자 포털 초기 로딩 시간 30% 개선
- [ ] API 응답 시간 평균 200ms 이하 유지
- [ ] 페이지 로딩 시간 2초 이하 달성

### 개발 효율성
- [ ] 코드 중복률 20% 이하로 감소
- [ ] 독립적인 배포 파이프라인 구축
- [ ] 테스트 커버리지 80% 이상 유지
- [ ] 개발자 온보딩 시간 50% 단축

### 사용자 경험
- [ ] SSO 로그인 플로우 3단계 이하
- [ ] 서비스 간 이동 시 재인증 불필요
- [ ] 관리자 도구 접근성 개선
- [ ] 사용자 만족도 점수 4.5/5.0 이상

## 🔗 관련 문서

- [DOMAIN_ARCHITECTURE_PLAN.md](../DOMAIN_ARCHITECTURE_PLAN.md) - 도메인 아키텍처 계획
- [MY_PICK_PROJECT_SEPARATION_PLAN.md](../MY_PICK_PROJECT_SEPARATION_PLAN.md) - my-pick 분리 계획
- [portal-client/CLAUDE.md](./CLAUDE.md) - 현재 portal-client 개발 가이드
- [shared-lib/CLAUDE.md](../shared-lib/CLAUDE.md) - 공유 라이브러리 가이드

## 📞 지원 및 문의

portal-client 분리 과정에서 이슈나 질문이 있을 경우:
1. GitHub Issues에 portal-client 라벨로 등록
2. 팀 Slack #frontend 채널에서 논의
3. 주간 프론트엔드 미팅에서 진행 상황 공유

---

**작성일**: 2025-08-04  
**버전**: 1.0  
**작성자**: Claude Code Assistant  
**검토자**: 프론트엔드팀, 인프라팀