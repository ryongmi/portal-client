# CLAUDE.md - Portal Client

이 파일은 portal-client 작업 시 Claude Code의 가이드라인을 제공합니다.

## 프로젝트 개요

portal-client는 krgeobuk 생태계의 사용자 포털로, 서비스 목록 조회·사용자 인증·프로필 관리를 제공합니다.

### 기술 스택
- **Next.js 15** (App Router), **TypeScript 5**
- **TanStack Query 5** - 서버 상태 관리
- **Zustand 5** - 클라이언트 전역 상태
- **React Context** - 인증 Context (AuthProvider)
- **Tailwind CSS 3** - 유틸리티 CSS, 다크 모드 지원
- **React Hook Form 7** - 폼 관리
- **@krgeobuk/http-client** - Axios 기반 HTTP 클라이언트 (토큰 자동 갱신 내장)

## 핵심 명령어

```bash
# 개발 서버 (포트 3200)
npm run dev

# 빌드 & 프로덕션 서버
npm run build
npm run start

# 코드 품질
npm run lint          # ESLint 검사
npm run type-check    # TypeScript 타입 검사
```

## 아키텍처

### 디렉터리 구조

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 홈 (서비스 포탈)
│   ├── profile/page.tsx          # 사용자 프로필
│   ├── settings/page.tsx         # 설정
│   ├── help/page.tsx             # 도움말
│   └── layout.tsx                # 루트 레이아웃
│
├── components/
│   ├── auth/AuthGuard.tsx        # 인증 보호 컴포넌트
│   ├── common/                   # 공통 UI (Button, Modal, Toast, Table 등)
│   ├── layout/                   # Layout, Header, Sidebar, SimpleLayout
│   ├── profile/UserProfileCard.tsx
│   └── providers/Providers.tsx   # 루트 프로바이더
│
├── context/
│   └── AuthContext.tsx           # AuthProvider + useAuth()
│
├── hooks/
│   ├── queries/
│   │   ├── keys.ts               # Query Key Factory
│   │   ├── auth.ts               # useAuthInitialize, useMyProfile
│   │   └── users.ts              # useUsers, useUserById
│   └── mutations/
│       ├── auth.ts               # useLogout
│       └── users.ts              # useUpdateMyProfile, useDeleteMyAccount, useChangePassword
│
├── services/
│   ├── base/BaseService.ts       # 공통 에러 핸들러
│   ├── authService.ts            # 인증 API (singleton)
│   └── userService.ts            # 사용자 API (singleton)
│
├── store/
│   ├── authStore.ts              # Zustand: isAuthenticated, isInitialized
│   └── themeStore.ts             # Zustand: 다크 모드
│
├── lib/
│   └── httpClient.ts             # @krgeobuk/http-client 인스턴스 (authApi, authzApi, portalApi)
│
├── middleware.ts                 # 보안 미들웨어 (CSP, CSRF, Rate Limiting)
├── types/                        # 타입 정의
└── utils/                        # 유틸리티
```

### 연결 서버

| 서버 | 환경 변수 | 포트 | 용도 |
|------|-----------|------|------|
| auth-server | `NEXT_PUBLIC_AUTH_SERVER_URL` | 8000 | 인증, 사용자 정보 |
| authz-server | `NEXT_PUBLIC_AUTHZ_SERVER_URL` | 8100 | 권한, 역할 |
| portal-server | `NEXT_PUBLIC_PORTAL_SERVER_URL` | 8200 | 서비스 목록 |

---

# portal-client 개발 가이드

> **Next.js 공통 개발 표준**: [docs/KRGEOBUK_NEXTJS_CLIENT_GUIDE.md](../docs/KRGEOBUK_NEXTJS_CLIENT_GUIDE.md)를 필수로 참조하세요.

## 상태 관리 아키텍처

portal-client는 세 가지 상태 레이어를 목적에 따라 분리합니다.

```
서버 상태     → TanStack Query (React Query)
전역 UI 상태  → Zustand
인증 Context  → React Context (AuthProvider)
```

### 1. Zustand 스토어 패턴

```typescript
// src/store/authStore.ts
interface AuthStore {
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuthenticated: (value: boolean) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isInitialized: false,
  setAuthenticated: (value): void => set({ isAuthenticated: value }),
  setInitialized: (value): void => set({ isInitialized: value }),
  clearAuth: (): void => set({ isAuthenticated: false, isInitialized: false }),
}));
```

### 2. React Query - Query Key Factory

모든 query key는 `src/hooks/queries/keys.ts`에서 중앙 관리합니다.

```typescript
// src/hooks/queries/keys.ts
export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
    initialize: () => ['auth', 'initialize'] as const,
    myProfile: () => ['auth', 'myProfile'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (query?: object) => ['users', 'list', query] as const,
    detail: (id: string | null) => ['users', 'detail', id] as const,
  },
} as const;
```

> **규칙**: 인라인 문자열 키 사용 금지. 반드시 `queryKeys.*` 사용.

### 3. React Query - 쿼리 훅 패턴

훅은 도메인별 파일로 그룹화합니다 (`queries/auth.ts`, `queries/users.ts`).

```typescript
// src/hooks/queries/auth.ts
export function useAuthInitialize(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.auth.initialize(),
    queryFn: () => authService.initialize(),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<UserProfile>({
    queryKey: queryKeys.auth.myProfile(),
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 4. React Query - 뮤테이션 훅 패턴

뮤테이션도 도메인별 파일로 그룹화합니다 (`mutations/auth.ts`, `mutations/users.ts`).

```typescript
// src/hooks/mutations/auth.ts
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: (): void => {
      clearAuth();
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.initialize() });
      void queryClient.removeQueries({ queryKey: queryKeys.auth.myProfile() });
    },
    onError: (): void => {
      clearAuth(); // 실패해도 클라이언트 상태 초기화
    },
  });
}
```

### 5. AuthContext - 인증 상태 통합

`AuthContext`는 React Query 결과를 Zustand 스토어와 동기화하는 역할을 합니다.

```typescript
// src/context/AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuthenticated, setInitialized, clearAuth } = useAuthStore();
  const initQuery = useAuthInitialize();

  // React Query 결과 → Zustand 동기화
  useEffect(() => {
    if (initQuery.isSuccess) {
      const { isLogin, user } = initQuery.data;
      setAuthenticated(!!(isLogin && user));
      setInitialized(true);
    } else if (initQuery.isError) {
      setAuthenticated(false);
      setInitialized(true);
    }
  }, [initQuery.isSuccess, initQuery.isError, initQuery.data]);

  // shared-lib tokenCleared 이벤트 수신
  useEffect(() => {
    const handleTokenCleared = (): void => clearAuth();
    window.addEventListener('tokenCleared', handleTokenCleared);
    return (): void => window.removeEventListener('tokenCleared', handleTokenCleared);
  }, [clearAuth]);

  const value = {
    user: initQuery.data?.user ?? null,
    loading: initQuery.isPending,
    isLoggedIn: isAuthenticated,
    error: initQuery.error ? String(initQuery.error) : null,
    logout: () => logoutMutation.mutateAsync(),
    refreshUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.myProfile() }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**컴포넌트에서 사용:**

```typescript
// AuthContext를 통해 (user, logout 등)
const { user, isLoggedIn, logout } = useAuth();

// Zustand를 통해 (경량 인증 상태만)
const { isAuthenticated, isInitialized } = useAuthStore();
```

---

## HTTP 클라이언트 패턴

### @krgeobuk/http-client 구조

`src/lib/httpClient.ts`에서 서버별 API 인스턴스를 제공합니다.

```typescript
// httpClient.ts
export const httpClient = new HttpClient(
  {
    auth: { baseURL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL!, withCredentials: true },
    authz: { baseURL: process.env.NEXT_PUBLIC_AUTHZ_SERVER_URL!, withCredentials: true },
    portal: { baseURL: process.env.NEXT_PUBLIC_PORTAL_SERVER_URL!, withCredentials: true },
  },
  { refreshUrl: process.env.NEXT_PUBLIC_TOKEN_REFRESH_URL!, refreshBeforeExpiry: 5 * 60 * 1000 },
  { enableCSRF: true, enableInputValidation: true, enableSecurityLogging: true }
);

export const authApi = { /* auth-server 전용 get/post/patch/delete */ };
export const authzApi = { /* authz-server 전용 */ };
export const portalApi = { /* portal-server 전용 */ };
export const tokenManager = httpClient.getTokenManager();
```

> **규칙**: 서버별로 `authApi`, `authzApi`, `portalApi`를 구분해서 사용. 직접 `axios.create()` 사용 금지.

### 서비스 레이어 패턴

서비스는 `BaseService`를 상속하는 클래스로 구현하고 싱글톤으로 내보냅니다.

```typescript
// src/services/authService.ts
export class AuthService extends BaseService {
  async initialize(): Promise<{ accessToken: string; user: UserProfile; isLogin: boolean }> {
    try {
      const response = await authApi.post<{ accessToken: string; user: UserProfile }>(
        '/auth/initialize'
      );
      tokenManager.setAccessToken(response.data.accessToken);
      return { ...response.data, isLogin: response.isLogin };
    } catch (error) {
      this.handleError(error); // BaseService 에러 핸들러
    }
  }

  async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout');
      tokenManager.clearAccessToken();
    } catch (error) {
      tokenManager.clearAccessToken(); // 실패해도 토큰 제거
      this.handleError(error);
    }
  }
}

export const authService = new AuthService(); // 싱글톤
```

---

## 인증 흐름

```
앱 시작 → Providers.tsx
  └─ AuthProvider
       └─ useAuthInitialize()        # POST /auth/initialize (RefreshToken → AccessToken)
            ├─ 성공 → tokenManager.setAccessToken()
            │         setAuthenticated(true), setInitialized(true)
            │         useMyProfile() 활성화 (enabled: isAuthenticated)
            └─ 실패 → setAuthenticated(false), setInitialized(true)

로그아웃 → useLogout()
  └─ POST /auth/logout
       → clearAuth() (Zustand)
       → invalidate authInitialize
       → remove myProfile 캐시
```

---

## 환경 변수

```bash
# API 서버
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000/api
NEXT_PUBLIC_AUTHZ_SERVER_URL=http://localhost:8100/api
NEXT_PUBLIC_PORTAL_SERVER_URL=http://localhost:8200/api
NEXT_PUBLIC_TOKEN_REFRESH_URL=http://localhost:8000/api/auth/refresh
NEXT_PUBLIC_PORTAL_CLIENT_URL=http://localhost:3200

# 환경
NEXT_PUBLIC_ENVIRONMENT=local
NODE_ENV=local
NEXT_TELEMETRY_DISABLED=1

# 보안
ALLOWED_ORIGINS=localhost,127.0.0.1
NEXT_PUBLIC_API_TIMEOUT=15000
NEXT_PUBLIC_ENABLE_CSRF=true
NEXT_PUBLIC_ENABLE_INPUT_VALIDATION=true
```

전체 목록: `.env.example`

---

## 컴포넌트 개발 패턴

### Providers.tsx 구조

```typescript
// src/components/providers/Providers.tsx
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  }));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <AuthProvider>
          <AuthGuard requireAuth={false}>{children}</AuthGuard>
          <ToastContainer position="top-right" maxToasts={5} />
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 경로 별칭

```typescript
// tsconfig.json: "@/*" → "./src/*"
import { queryKeys } from '@/hooks/queries/keys';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/httpClient';
```

---

## 개발 체크리스트

### 데이터 패칭
- [ ] 서버 상태는 React Query 사용 (`useQuery`, `useMutation`)
- [ ] query key는 반드시 `queryKeys.*` 사용 (인라인 문자열 금지)
- [ ] mutation 성공 후 관련 query `invalidateQueries` 또는 `removeQueries`
- [ ] `staleTime` 설정으로 불필요한 리패치 방지

### 상태 관리
- [ ] 전역 UI 상태 → Zustand
- [ ] 인증 상태 → `useAuthStore()` (isAuthenticated, isInitialized)
- [ ] 인증 정보 (user, logout) → `useAuth()` (AuthContext)

### HTTP 통신
- [ ] 서버별 API 인스턴스 구분: `authApi`, `authzApi`, `portalApi`
- [ ] 직접 axios 사용 금지 → `@krgeobuk/http-client` 사용
- [ ] 서비스 클래스는 `BaseService` 상속, 싱글톤으로 내보내기

### 코드 품질
- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] `'use client'` 지시어 필요한 컴포넌트에만 사용
- [ ] 이미지는 `next/image` 사용
