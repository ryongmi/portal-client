# portal-client 상태관리 리팩토링 계획

## 개요

Redux Toolkit 기반 상태관리를 **react-query + Zustand + react-hook-form** 조합으로 전환합니다.

> **상태: 계획** (2026-02)

### 목적

| 기존 | 문제점 | 전환 후 |
|------|--------|---------|
| Redux authSlice (서버 상태) | user 프로필 fetch를 위해 slice/thunk/extraReducers 전체 구조 유지 | react-query가 서버 상태 자동 관리 |
| Redux userSlice (서버 상태) | users 목록/pagination을 Redux에서 수동 관리 | react-query 캐싱/자동 재검증 |
| AuthContext (Redux 래퍼) | Redux 상태를 다시 Context로 감싸는 이중 계층 | Zustand + react-query로 직접 접근 |
| ThemeContext (Context API) | 상태 변경 시 Context 트리 전체 리렌더링 | Zustand 구독 컴포넌트만 리렌더링 |
| react-hook-form | 이미 설치됨 (^7.52.0) — 미구현 폼에 활용 확대 | 계정 설정 탭 등 신규 폼 적용 |

### 기술 스택 변경

```
제거: @reduxjs/toolkit, react-redux
추가: @tanstack/react-query
유지: react-hook-form (이미 설치됨)
신규 활용: zustand (기존 없음, 신규 설치)
```

---

## 상태 분류

### 서버 상태 → react-query

| Redux 코드 | 전환 | 비고 |
|-----------|------|------|
| `initializeAuth` thunk | `useAuthInitialize` query | 앱 시작 시 RefreshToken → AccessToken + user |
| `fetchUserProfile` thunk | `useMyProfile` query | 사용자 프로필 개별 조회 |
| `logoutUser` thunk | `useLogout` mutation | 로그아웃 후 캐시 무효화 |
| `fetchUsers` thunk | `useUsers` query | 페이지네이션 포함 |
| `fetchUserById` thunk | `useUserById` query | 특정 사용자 조회 |
| `updateMyProfile` thunk | `useUpdateMyProfile` mutation | 성공 시 profile 캐시 갱신 |
| `changePassword` thunk | `useChangePassword` mutation | |
| `deleteMyAccount` thunk | `useDeleteMyAccount` mutation | 성공 시 auth 캐시 클리어 |

### 클라이언트 상태 → Zustand

| Redux/Context 코드 | 전환 | 비고 |
|-------------------|------|------|
| `authSlice.isAuthenticated` | `authStore.isAuthenticated` | 서버 응답의 isLogin 플래그 기반 |
| `authSlice.isInitialized` | `authStore.isInitialized` | 앱 초기화 완료 여부 |
| `ThemeContext.theme` | `themeStore.theme` | localStorage 연동 |
| `ThemeContext.actualTheme` | `themeStore.actualTheme` | 시스템 테마 감지 |

---

## Phase 1: 패키지 설치 + QueryClientProvider 설정

### 1-1. 패키지 변경

```bash
# 추가
npm install @tanstack/react-query zustand

# 제거
npm uninstall @reduxjs/toolkit react-redux
```

### 1-2. Providers.tsx 수정

**파일**: `src/components/providers/Providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ToastContainer, { toast } from '@/components/common/ToastContainer';
import { ThemeInitializer } from '@/components/common/ThemeInitializer'; // Phase 2에서 생성

export function Providers({ children }: ProvidersProps): React.JSX.Element {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  }));

  // ... window toast 등록 useEffect 유지

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />     {/* DOM 사이드이펙트 처리 (ThemeContext 대체) */}
        <AuthProvider>
          <AuthGuard requireAuth={false}>
            {children}
          </AuthGuard>
          <ToastContainer position="top-right" maxToasts={5} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

> **auth-client와 차이**: `useState(() => new QueryClient(...))` 패턴으로 SSR 안전성 확보

---

## Phase 2: Zustand 스토어 생성

### 2-1. 생성: `src/store/authStore.ts`

Redux authSlice의 클라이언트 전용 상태만 이관:

```typescript
import { create } from 'zustand';

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

> **auth-client와 차이**: `loginAttempts` 같은 도메인 상태 없이 인증 플래그만 관리

### 2-2. 생성: `src/store/themeStore.ts`

ThemeContext 로직을 Zustand로 이전:

```typescript
import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  setActualTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  actualTheme: 'light',
  setTheme: (theme): void => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  setActualTheme: (actualTheme): void => set({ actualTheme }),
  toggleTheme: (): void => {
    const newTheme = get().actualTheme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },
}));
```

### 2-3. 생성: `src/components/common/ThemeInitializer.tsx`

DOM 사이드이펙트(클래스 토글, 시스템 감지)를 처리하는 렌더링 없는 컴포넌트:

```typescript
'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeInitializer(): null {
  const { theme, setTheme, setActualTheme } = useThemeStore();

  // localStorage에서 초기 테마 로드
  useEffect(() => {
    const saved = localStorage.getItem('theme') as typeof theme | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setTheme(saved);
    }
  }, []);

  // 시스템 테마 감지 + DOM 업데이트
  useEffect(() => {
    const getActual = (): 'light' | 'dark' =>
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : theme;

    const actual = getActual();
    setActualTheme(actual);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actual);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent): void => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return (): void => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return null;
}
```

### 2-4. 삭제 대상

- `src/store/index.ts`
- `src/store/hooks.ts`
- `src/store/slices/authSlice.ts`
- `src/store/slices/userSlice.ts`
- `src/context/ThemeContext.tsx`

---

## Phase 3: react-query Query 훅 생성

### 3-1. `src/hooks/queries/useAuthInitialize.ts`

앱 시작 시 RefreshToken → AccessToken + 사용자 정보 조회. `tokenManager.setAccessToken()` 사이드이펙트 처리:

```typescript
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAuthInitialize(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { setAuthenticated, setInitialized } = useAuthStore();

  return useQuery({
    queryKey: ['authInitialize'],
    queryFn: async () => {
      const result = await authService.initialize(); // tokenManager.setAccessToken 내부 처리
      return result;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    // onSuccess/onError → useEffect로 authStore 상태 동기화 (컴포넌트에서 처리)
  });
}
```

> **핵심**: `authService.initialize()` 내부에서 `tokenManager.setAccessToken()` 이 처리되므로 onSuccess 불필요. 단, `isAuthenticated`/`isInitialized` Zustand 상태는 컴포넌트(AuthProvider)에서 동기화.

### 3-2. `src/hooks/queries/useMyProfile.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@krgeobuk/user/interfaces';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useMyProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<UserProfile>({
    queryKey: ['myProfile'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3-3. `src/hooks/queries/useUsers.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { UserSearchQuery } from '@krgeobuk/user';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUsers(query: UserSearchQuery = {}) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => userService.getUsers(query),
    staleTime: 2 * 60 * 1000,
  });
}
```

### 3-4. `src/hooks/queries/useUserById.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
  });
}
```

---

## Phase 4: react-query Mutation 훅 생성

### 4-1. `src/hooks/mutations/useLogout.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),  // tokenManager.clearAccessToken() 내부 처리
    onSuccess: (): void => {
      clearAuth();
      void queryClient.invalidateQueries({ queryKey: ['authInitialize'] });
      void queryClient.removeQueries({ queryKey: ['myProfile'] });
    },
    onError: (): void => {
      // 실패해도 클라이언트 상태 초기화 (기존 로직 유지)
      clearAuth();
    },
  });
}
```

### 4-2. `src/hooks/mutations/useUpdateMyProfile.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { UpdateMyProfile } from '@krgeobuk/user';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMyProfile) => userService.updateMyProfile(data),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
}
```

### 4-3. `src/hooks/mutations/useChangePassword.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { ChangePassword } from '@krgeobuk/user';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePassword) => userService.changePassword(data),
  });
}
```

### 4-4. `src/hooks/mutations/useDeleteMyAccount.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useDeleteMyAccount() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => userService.deleteMyAccount(),
    onSuccess: (): void => {
      clearAuth();
      queryClient.clear();
    },
  });
}
```

---

## Phase 5: AuthContext 단순화

**파일**: `src/context/AuthContext.tsx`

Redux 의존성 제거. Zustand + react-query 기반으로 재구성:

```typescript
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthInitialize } from '@/hooks/queries/useAuthInitialize';
import { useLogout } from '@/hooks/mutations/useLogout';
import { useAuthStore } from '@/store/authStore';
import { tokenManager } from '@/lib/httpClient';
import type { UserProfile } from '@krgeobuk/user/interfaces';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const { setAuthenticated, setInitialized, clearAuth, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogout();

  // 앱 초기화
  const initQuery = useAuthInitialize();

  // react-query 결과를 Zustand 상태로 동기화
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

  // tokenCleared 이벤트 (shared-lib에서 발생)
  useEffect(() => {
    const handleTokenCleared = (): void => clearAuth();
    window.addEventListener('tokenCleared', handleTokenCleared);
    return (): void => window.removeEventListener('tokenCleared', handleTokenCleared);
  }, []);

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const refreshUser = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
  };

  const value: AuthContextType = {
    user: initQuery.data?.user ?? null,
    loading: initQuery.isPending,
    isLoggedIn: isAuthenticated,
    error: initQuery.error ? String(initQuery.error) : null,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
```

---

## Phase 6: 커스텀 훅 수정

### 6-1. `src/hooks/useAuth.ts` 재작성

Redux 제거, Zustand + react-query 기반:

```typescript
// Before: useAppDispatch + useAppSelector → initializeAuth dispatch
// After: useAuthStore + react-query query 상태

import { useAuthStore } from '@/store/authStore';
import { useAuthInitialize } from '@/hooks/queries/useAuthInitialize';

export const useAuth = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const initQuery = useAuthInitialize({ enabled: !isInitialized });

  return {
    user: initQuery.data?.user ?? null,
    isAuthenticated,
    isLoading: initQuery.isPending,
    error: initQuery.error ? String(initQuery.error) : null,
    isInitialized,
  };
};
```

### 6-2. `src/hooks/useUserProfile.ts` 재작성

Redux 제거, react-query `useMyProfile` 기반:

```typescript
// Before: useAppSelector(state.auth) + dispatch(fetchUserProfile)
// After: useMyProfile query 직접 사용

import { useMyProfile } from '@/hooks/queries/useMyProfile';
import type { UserProfile } from '@krgeobuk/user/interfaces';

export const useUserProfile = () => {
  const { data: userProfile, isPending: loading, error } = useMyProfile();

  return {
    userProfile: userProfile ?? null,
    loading,
    error: error ? String(error) : null,
    refetch: async () => { /* queryClient.invalidateQueries(['myProfile']) */ },
    hasGoogleAuth: userProfile?.oauthAccount.provider === 'google' ?? false,
    hasNaverAuth: userProfile?.oauthAccount.provider === 'naver' ?? false,
    isHomepageUser: userProfile?.oauthAccount.provider === 'homePage' ?? false,
    availableServices: userProfile?.availableServices ?? [],
    roles: userProfile?.authorization.roles ?? [],
    permissions: userProfile?.authorization.permissions ?? [],
  };
};

// usePermission, useRole, usePermissions, useAnyRole 유지 (내부만 useUserProfile 사용)
```

---

## Phase 7: 컴포넌트 수정

### 수정 대상

| 컴포넌트 | 변경 내용 |
|---------|-----------|
| `AuthGuard.tsx` | `useAuth()` → Zustand `isInitialized` 사용 |
| `UserProfileCard.tsx` | `useUserProfile()` 훅 유지 (내부만 react-query로 변경됨) |
| `app/page.tsx` (홈) | `useAuth()`, `useUserProfile()` 훅 유지 (내부 변경 투명) |
| `components/common/ThemeToggle.tsx` | `useTheme()` → `useThemeStore()` |

### AuthGuard.tsx 수정

```typescript
// Before
const { isLoading } = useAuth();
if (isLoading) return <LoadingScreen />;

// After
import { useAuthStore } from '@/store/authStore';
const { isInitialized } = useAuthStore();
const { isLoading } = useAuth();
if (!isInitialized || isLoading) return <LoadingScreen />;
```

---

## Phase 8: 정리 + 검증

### 8-1. 삭제 파일 목록

| 파일 | 이유 |
|------|------|
| `src/store/index.ts` | Redux store 제거 |
| `src/store/hooks.ts` | useAppDispatch/useAppSelector 불필요 |
| `src/store/slices/authSlice.ts` | react-query + Zustand로 분리 |
| `src/store/slices/userSlice.ts` | react-query mutation/query로 대체 |
| `src/context/ThemeContext.tsx` | themeStore + ThemeInitializer로 대체 |

### 8-2. 생성 파일 목록

| 파일 | 역할 |
|------|------|
| `src/store/authStore.ts` | 인증 클라이언트 상태 (isAuthenticated, isInitialized) |
| `src/store/themeStore.ts` | 테마 클라이언트 상태 |
| `src/components/common/ThemeInitializer.tsx` | 테마 DOM 사이드이펙트 처리 |
| `src/hooks/queries/useAuthInitialize.ts` | 앱 초기화 query |
| `src/hooks/queries/useMyProfile.ts` | 내 프로필 query |
| `src/hooks/queries/useUsers.ts` | 사용자 목록 query |
| `src/hooks/queries/useUserById.ts` | 사용자 상세 query |
| `src/hooks/mutations/useLogout.ts` | 로그아웃 mutation |
| `src/hooks/mutations/useUpdateMyProfile.ts` | 프로필 수정 mutation |
| `src/hooks/mutations/useChangePassword.ts` | 비밀번호 변경 mutation |
| `src/hooks/mutations/useDeleteMyAccount.ts` | 계정 삭제 mutation |

### 8-3. 주요 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `package.json` | 의존성 변경 |
| `src/components/providers/Providers.tsx` | Redux 제거, QueryClientProvider + ThemeInitializer 추가 |
| `src/context/AuthContext.tsx` | Redux 제거, Zustand + react-query 기반 재구성 |
| `src/hooks/useAuth.ts` | Zustand + react-query 기반 재작성 |
| `src/hooks/useUserProfile.ts` | react-query useMyProfile 기반 재작성 |
| `src/components/auth/AuthGuard.tsx` | Zustand isInitialized 사용 |
| `src/components/common/ThemeToggle.tsx` | useTheme → useThemeStore |
| `src/app/settings/page.tsx` | useTheme → useThemeStore (ThemeToggle 통해 간접 변경) |

### 8-4. 유지 파일 (변경 없음)

- `src/services/*` — 서비스 레이어
- `src/lib/httpClient.ts` — HTTP 클라이언트 (tokenManager 포함)
- `src/hooks/useAccessibility.ts` — 접근성 훅
- `src/components/common/*` — 공통 UI 컴포넌트 (FormField, Toast 등)
- `src/app/page.tsx` — 홈 페이지 (useAuth/useUserProfile 훅 시그니처 유지로 변경 없음)
- `src/app/profile/page.tsx` — 프로필 페이지
- `src/app/settings/page.tsx` — 설정 페이지 (useAccessibility 유지)
- `src/types/*` — 타입 정의

---

## auth-client 대비 주요 차이점

| 항목 | auth-client | portal-client |
|------|------------|---------------|
| react-hook-form | 신규 도입 | 이미 설치됨 — 신규 폼에 활용 |
| ThemeContext | 없음 | Context → Zustand 전환 |
| AuthContext | 없음 | Redux 래퍼 제거, 단순화 |
| tokenManager 연동 | accessToken 파라미터 전달 | shared-lib tokenManager가 자동 처리 |
| 인증 초기화 | useEffect에서 mutation.mutate | AuthProvider의 useQuery + useEffect로 동기화 |
| userSlice (목록/페이지네이션) | 없음 | useUsers query로 대체 |

---

## 진행 순서

각 Phase 완료 후 `npm run build`로 확인하고 커밋:

1. **Phase 1** — 패키지 + Provider (기반 설정)
2. **Phase 2** — Zustand 스토어 + ThemeInitializer
3. **Phase 3** — Query 훅 4개 생성
4. **Phase 4** — Mutation 훅 4개 생성
5. **Phase 5** — AuthContext 재구성
6. **Phase 6** — useAuth, useUserProfile 수정
7. **Phase 7** — 컴포넌트 수정 (AuthGuard, ThemeToggle)
8. **Phase 8** — 파일 정리 + lint + build 검증
