# Portal-Client 상태 관리 리팩토링 계획

> Redux → React Query (서버 상태) + Zustand (클라이언트 상태)

## 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [타겟 아키텍처](#2-타겟-아키텍처)
3. [파일 구조 변경](#3-파일-구조-변경)
4. [마이그레이션 단계](#4-마이그레이션-단계)
5. [핵심 구현 코드](#5-핵심-구현-코드)
6. [검증 및 테스트](#6-검증-및-테스트)
7. [롤백 계획](#7-롤백-계획)

---

## 1. 현재 상태 분석

### 1.1 Redux Store 구조

```
store/
├── index.ts          # configureStore
├── hooks.ts          # useAppDispatch, useAppSelector
└── slices/
    ├── authSlice.ts  # Auth 상태 관리
    └── userSlice.ts  # User 상태 관리
```

### 1.2 AuthSlice 상태

```typescript
interface AuthState {
  user: UserProfile | null;      // 서버 상태
  isAuthenticated: boolean;      // user 존재 여부로 파생
  isLoading: boolean;            // 로딩 상태
  error: string | null;          // 에러 상태
  isInitialized: boolean;        // 앱 초기화 플래그
}
```

**Async Thunks:**
- `initializeAuth` - RefreshToken으로 인증 초기화
- `fetchUserProfile` - 현재 사용자 프로필 조회
- `logoutUser` - 로그아웃

### 1.3 UserSlice 상태

```typescript
interface UserState {
  users: UserSearchResult[];       // 서버 상태
  currentUser: UserDetail | null;  // 서버 상태 (auth.user와 중복)
  selectedUser: UserDetail | null; // UI 상태
  isLoading: boolean;              // 로딩 상태
  error: string | null;            // 에러 상태
  pagination: PaginatedResultBase; // 서버 상태
}
```

**Async Thunks:**
- `fetchUsers` - 사용자 목록 조회 (페이지네이션)
- `fetchUserById` - 단일 사용자 조회
- `updateMyProfile` - 프로필 수정
- `changePassword` - 비밀번호 변경
- `deleteMyAccount` - 계정 삭제

### 1.4 현재 문제점

| 문제 | 설명 |
|-----|------|
| **상태 중복** | `auth.user`와 `user.currentUser`가 유사한 데이터 저장 |
| **훅 중복** | `useAuth`가 `hooks/useAuth.ts`와 `context/AuthContext.tsx`에 중복 존재 |
| **관심사 혼재** | 서버 상태와 클라이언트 상태가 동일 store에 혼재 |
| **수동 캐싱** | 자동 캐시 무효화나 백그라운드 리페칭 없음 |

---

## 2. 타겟 아키텍처

### 2.1 상태 분류

| 상태 | 현재 위치 | 타겟 위치 | 분류 |
|-----|---------|---------|------|
| user (프로필) | `auth.user` | React Query | 서버 상태 |
| users (목록) | `user.users` | React Query | 서버 상태 |
| pagination | `user.pagination` | React Query | 서버 상태 |
| isAuthenticated | `auth.isAuthenticated` | Zustand (파생) | 클라이언트 상태 |
| isInitialized | `auth.isInitialized` | Zustand | 클라이언트 상태 |
| selectedUserId | `user.selectedUser` | Zustand | UI 상태 |

### 2.2 기술 스택

| 역할 | 라이브러리 | 버전 |
|-----|----------|------|
| 서버 상태 관리 | @tanstack/react-query | ^5.x |
| 서버 상태 디버깅 | @tanstack/react-query-devtools | ^5.x |
| 클라이언트 상태 관리 | zustand | ^4.x |

### 2.3 장점

1. **관심사 분리** - 서버 상태(React Query) vs 클라이언트 상태(Zustand)
2. **자동 캐싱** - React Query가 캐시 무효화 자동 처리
3. **백그라운드 리페치** - stale 데이터 자동 갱신
4. **DevTools** - React Query DevTools로 디버깅
5. **번들 크기 감소** - Zustand가 Redux Toolkit보다 가벼움
6. **보일러플레이트 감소** - Redux slice 대비 간단한 코드
7. **Optimistic Updates** - 낙관적 업데이트 내장 지원

---

## 3. 파일 구조 변경

### 3.1 새 파일 구조

```
src/
├── lib/
│   └── query-client.ts              # [신규] React Query 클라이언트 설정
├── stores/
│   ├── index.ts                     # [신규] Store exports
│   ├── authStore.ts                 # [신규] Auth 클라이언트 상태
│   └── uiStore.ts                   # [신규] UI 상태
├── queries/
│   ├── index.ts                     # [신규] Query exports
│   ├── keys.ts                      # [신규] Query key factory
│   ├── auth.queries.ts              # [신규] Auth queries/mutations
│   └── user.queries.ts              # [신규] User queries/mutations
├── hooks/
│   ├── useAuth.ts                   # [수정] RQ + Zustand 기반으로 교체
│   └── useUserProfile.ts            # [수정] RQ 기반으로 교체
├── components/providers/
│   └── Providers.tsx                # [수정] QueryClientProvider 추가
├── context/
│   └── AuthContext.tsx              # [삭제] useAuth로 통합
├── store/                           # [삭제] 전체 디렉토리
│   ├── index.ts
│   ├── hooks.ts
│   └── slices/
│       ├── authSlice.ts
│       └── userSlice.ts
└── services/                        # [유지] 변경 없음
    ├── authService.ts
    └── userService.ts
```

### 3.2 파일 변경 요약

#### 신규 생성 (8개)

| 파일 | 목적 |
|-----|------|
| `src/lib/query-client.ts` | React Query 클라이언트 설정 |
| `src/queries/keys.ts` | Query key factory |
| `src/queries/auth.queries.ts` | Auth 관련 queries/mutations |
| `src/queries/user.queries.ts` | User 관련 queries/mutations |
| `src/queries/index.ts` | Query exports |
| `src/stores/authStore.ts` | Auth 클라이언트 상태 (Zustand) |
| `src/stores/uiStore.ts` | UI 상태 (Zustand) |
| `src/stores/index.ts` | Store exports |

#### 수정 (3개)

| 파일 | 변경 내용 |
|-----|---------|
| `src/hooks/useAuth.ts` | React Query + Zustand 기반으로 전체 교체 |
| `src/hooks/useUserProfile.ts` | React Query 기반으로 전체 교체 |
| `src/components/providers/Providers.tsx` | QueryClientProvider 추가, Redux 제거 |

#### 삭제 (5개)

| 파일 | 이유 |
|-----|------|
| `src/context/AuthContext.tsx` | useAuth 훅으로 통합 |
| `src/store/index.ts` | Redux 제거 |
| `src/store/hooks.ts` | Redux 제거 |
| `src/store/slices/authSlice.ts` | React Query로 대체 |
| `src/store/slices/userSlice.ts` | React Query로 대체 |

---

## 4. 마이그레이션 단계

### Phase 1: 의존성 설치 및 신규 파일 생성

**목표:** 기존 코드 변경 없이 새 구조만 추가

```bash
# 패키지 설치
npm install @tanstack/react-query @tanstack/react-query-devtools zustand
```

**생성할 파일:**
- `src/lib/query-client.ts`
- `src/queries/keys.ts`
- `src/queries/auth.queries.ts`
- `src/queries/user.queries.ts`
- `src/queries/index.ts`
- `src/stores/authStore.ts`
- `src/stores/uiStore.ts`
- `src/stores/index.ts`

**검증:**
```bash
npm run type-check
npm run build
```

---

### Phase 2: Provider 마이그레이션

**목표:** QueryClientProvider 추가, Redux Provider 임시 유지

**수정할 파일:**
- `src/components/providers/Providers.tsx`

**변경 내용:**
1. `QueryClientProvider` 추가
2. Redux `Provider` 유지 (임시)
3. React Query DevTools 추가 (개발 환경)

**검증:**
- 애플리케이션 정상 시작 확인
- 기존 기능 동작 확인

---

### Phase 3: Hook 마이그레이션

**목표:** 핵심 훅을 새 구현으로 교체

**수정할 파일:**
- `src/hooks/useAuth.ts` - 전체 교체
- `src/hooks/useUserProfile.ts` - 전체 교체

**중요:** 기존 반환 인터페이스 유지로 컴포넌트 수정 최소화

**검증:**
- 홈페이지 정상 로드
- 프로필 페이지 정상 동작
- 헤더 사용자 메뉴 정상 동작

---

### Phase 4: Context 제거

**목표:** 중복 AuthContext 제거

**변경 내용:**
1. `src/context/AuthContext.tsx` 삭제
2. `Providers.tsx`에서 `AuthProvider` 제거

**검증:**
- 전체 기능 테스트 수행

---

### Phase 5: Redux 정리

**목표:** Redux 완전 제거

**삭제할 파일:**
- `src/store/index.ts`
- `src/store/hooks.ts`
- `src/store/slices/authSlice.ts`
- `src/store/slices/userSlice.ts`
- `src/store/` 디렉토리

**수정할 파일:**
- `src/components/providers/Providers.tsx` - Redux Provider 제거

**의존성 제거:**
```bash
npm uninstall @reduxjs/toolkit react-redux
```

**최종 검증:**
```bash
npm run type-check
npm run lint
npm run build
```

---

## 5. 핵심 구현 코드

### 5.1 React Query 클라이언트 설정

**`src/lib/query-client.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5분
      gcTime: 10 * 60 * 1000,         // 10분 (이전 cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 5.2 Query Key Factory

**`src/queries/keys.ts`**

```typescript
import type { UserSearchQuery } from '@/types';

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    initialize: () => [...queryKeys.auth.all, 'initialize'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: (query?: UserSearchQuery) => [...queryKeys.users.all, 'list', query] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
  },
} as const;
```

### 5.3 Auth Queries

**`src/queries/auth.queries.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { queryKeys } from './keys';
import { useAuthStore } from '@/stores/authStore';

// 인증 초기화 (앱 마운트 시 1회 호출)
export const useInitializeAuth = () => {
  const setInitialized = useAuthStore((state) => state.setInitialized);

  return useQuery({
    queryKey: queryKeys.auth.initialize(),
    queryFn: async () => {
      const result = await authService.initialize();
      return result;
    },
    staleTime: Infinity,
    retry: false,
    onSettled: () => {
      setInitialized(true);
    },
  });
};

// 현재 사용자 프로필 조회
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });
};

// 로그아웃 mutation
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const setInitialized = useAuthStore((state) => state.setInitialized);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.initialize(), null);
      queryClient.setQueryData(queryKeys.auth.currentUser(), null);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: () => {
      queryClient.setQueryData(queryKeys.auth.initialize(), null);
      setInitialized(true);
    },
  });
};

// 사용자 프로필 새로고침
export const useRefreshUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.getCurrentUser(),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.currentUser(), data);
      queryClient.setQueryData(queryKeys.auth.initialize(), (old: any) => ({
        ...old,
        user: data,
      }));
    },
  });
};
```

### 5.4 User Queries

**`src/queries/user.queries.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { queryKeys } from './keys';
import type { UserSearchQuery, UpdateMyProfileRequest, ChangePasswordRequest } from '@/types';

// 사용자 목록 조회 (페이지네이션)
export const useUsersQuery = (query?: UserSearchQuery) => {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => userService.getUsers(query),
    staleTime: 2 * 60 * 1000,
  });
};

// 단일 사용자 조회
export const useUserByIdQuery = (userId: string | null) => {
  return useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// 프로필 수정 mutation
export const useUpdateMyProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: UpdateMyProfileRequest) =>
      userService.updateMyProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.initialize() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
};

// 비밀번호 변경 mutation
export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (passwordData: ChangePasswordRequest) =>
      userService.changePassword(passwordData),
  });
};

// 계정 삭제 mutation
export const useDeleteMyAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.deleteMyAccount(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
```

### 5.5 Zustand Stores

**`src/stores/authStore.ts`**

```typescript
import { create } from 'zustand';
import { tokenManager } from '@/lib/httpClient';

interface AuthStore {
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isInitialized: false,

  setInitialized: (value) => set({ isInitialized: value }),

  clearAuth: () => {
    tokenManager.clearAccessToken();
    set({ isInitialized: true });
  },
}));
```

**`src/stores/uiStore.ts`**

```typescript
import { create } from 'zustand';

interface UIStore {
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
}));
```

### 5.6 통합 Hooks (하위 호환)

**`src/hooks/useAuth.ts`**

```typescript
'use client';

import { useEffect } from 'react';
import { useInitializeAuth, useLogoutMutation, useRefreshUserProfile } from '@/queries/auth.queries';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@krgeobuk/user/interfaces';

interface UseAuthReturn {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data: initData, isLoading, error: queryError } = useInitializeAuth();
  const logoutMutation = useLogoutMutation();
  const refreshMutation = useRefreshUserProfile();

  // 토큰 만료 이벤트 핸들러
  useEffect(() => {
    const handleTokenCleared = (): void => {
      clearAuth();
    };

    window.addEventListener('tokenCleared', handleTokenCleared);
    return () => {
      window.removeEventListener('tokenCleared', handleTokenCleared);
    };
  }, [clearAuth]);

  const user = initData?.isLogin && initData?.user ? initData.user : null;
  const isAuthenticated = !!user && !!initData?.isLogin;

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } catch (_error) {
      clearAuth();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      await refreshMutation.mutateAsync();
    } catch (_error) {
      // Error handled by mutation
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error: queryError?.message ?? null,
    isInitialized,
    logout,
    refreshUser,
  };
};
```

**`src/hooks/useUserProfile.ts`**

```typescript
'use client';

import { useAuth } from './useAuth';
import type { UserProfile } from '@krgeobuk/user/interfaces';

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasGoogleAuth: boolean;
  hasNaverAuth: boolean;
  isHomepageUser: boolean;
  availableServices: UserProfile['availableServices'];
  roles: string[];
  permissions: string[];
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { user: userProfile, isLoading: loading, error, refreshUser } = useAuth();

  const hasGoogleAuth = userProfile?.oauthAccount?.provider === 'google';
  const hasNaverAuth = userProfile?.oauthAccount?.provider === 'naver';
  const isHomepageUser = userProfile?.oauthAccount?.provider === 'homePage';

  return {
    userProfile,
    loading,
    error,
    refetch: refreshUser,
    hasGoogleAuth,
    hasNaverAuth,
    isHomepageUser,
    availableServices: userProfile?.availableServices ?? [],
    roles: userProfile?.authorization?.roles ?? [],
    permissions: userProfile?.authorization?.permissions ?? [],
  };
};

// 권한 확인 훅
export const usePermission = (permission: string): boolean => {
  const { permissions } = useUserProfile();
  return permissions.includes(permission);
};

// 역할 확인 훅
export const useRole = (role: string): boolean => {
  const { roles } = useUserProfile();
  return roles.includes(role);
};

// 다중 권한 확인 (AND 조건)
export const usePermissions = (requiredPermissions: string[]): boolean => {
  const { permissions } = useUserProfile();
  return requiredPermissions.every((p) => permissions.includes(p));
};

// 다중 역할 확인 (OR 조건)
export const useAnyRole = (targetRoles: string[]): boolean => {
  const { roles } = useUserProfile();
  return targetRoles.some((r) => roles.includes(r));
};
```

### 5.7 업데이트된 Providers

**`src/components/providers/Providers.tsx`**

```typescript
'use client';

import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ToastContainer, { toast } from '@/components/common/ToastContainer';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as { showToast?: typeof toast }).showToast = toast;
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      if (!event.reason?.message?.includes('Network Error')) {
        toast.error('예상치 못한 오류', '문제가 지속되면 페이지를 새로고침해주세요.', {
          duration: 3000,
        });
      }
    };

    const handleError = (_event: ErrorEvent): void => {
      // Production error logging
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return (): void => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      if (typeof window !== 'undefined') {
        delete (window as { showToast?: typeof toast }).showToast;
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard requireAuth={false}>
            {children}
          </AuthGuard>
          <ToastContainer position="top-right" maxToasts={5} />
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

---

## 6. 검증 및 테스트

### 6.1 기능 테스트 체크리스트

| 테스트 항목 | 확인 내용 |
|-----------|---------|
| 비인증 사용자 | 홈페이지 정상 로드, 로그인 프롬프트 표시 |
| SSO 로그인 | 리다이렉트 후 인증 상태 설정 |
| 인증된 사용자 | 프로필 페이지 데이터 표시 |
| 프로필 페이지 | 사용자 정보, 서비스 목록 표시 |
| 헤더 | 사용자 메뉴 정상 동작 |
| 로그아웃 | 상태 초기화, 홈으로 리다이렉트 |
| 페이지 새로고침 | 인증 상태 유지 (initialize API) |
| 토큰 만료 | TokenManager 이벤트 처리, 상태 초기화 |

### 6.2 기술 테스트

```bash
# TypeScript 타입 검사
npm run type-check

# ESLint 검사
npm run lint

# 프로덕션 빌드
npm run build

# 개발 서버 실행
npm run dev
```

### 6.3 React Query DevTools 활용

개발 환경에서 React Query DevTools로 다음 항목 확인:
- Query 캐시 상태
- Stale/Fresh 상태
- 백그라운드 리페치 동작
- Mutation 실행 결과

---

## 7. 롤백 계획

마이그레이션 중 문제 발생 시 롤백 방법:

### Phase 1-2 롤백
```bash
# 새 파일만 추가했으므로 삭제
rm -rf src/lib/query-client.ts
rm -rf src/queries/
rm -rf src/stores/
```

### Phase 3 롤백
```bash
# Git에서 훅 복원
git checkout src/hooks/useAuth.ts
git checkout src/hooks/useUserProfile.ts
```

### Phase 4-5 롤백
```bash
# Git에서 전체 복원
git checkout src/context/AuthContext.tsx
git checkout src/store/

# Redux 재설치
npm install @reduxjs/toolkit react-redux
```

---

## 부록: 의존성 변경

### 추가
```json
{
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-query-devtools": "^5.x",
  "zustand": "^4.x"
}
```

### 제거
```json
{
  "@reduxjs/toolkit": "제거",
  "react-redux": "제거"
}
```

---

## 진행 상태

| Phase | 상태 | 완료일 |
|-------|-----|-------|
| Phase 1 | 대기 | - |
| Phase 2 | 대기 | - |
| Phase 3 | 대기 | - |
| Phase 4 | 대기 | - |
| Phase 5 | 대기 | - |
