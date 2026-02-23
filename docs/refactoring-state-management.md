# portal-client 상태관리 리팩토링

## 개요

Redux Toolkit 기반 상태관리를 **react-query + Zustand + react-hook-form** 조합으로 전환합니다.

> **상태: 완료** (2026-02)

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
추가: @tanstack/react-query, zustand
유지: react-hook-form (이미 설치됨)
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
| `deleteMyAccount` thunk | `useDeleteMyAccount` mutation | 성공 시 전체 캐시 클리어 |

### 클라이언트 상태 → Zustand

| Redux/Context 코드 | 전환 | 비고 |
|-------------------|------|------|
| `authSlice.isAuthenticated` | `authStore.isAuthenticated` | 서버 응답의 isLogin 플래그 기반 |
| `authSlice.isInitialized` | `authStore.isInitialized` | 앱 초기화 완료 여부 |
| `ThemeContext.theme` | `themeStore.theme` | localStorage 연동 |
| `ThemeContext.actualTheme` | `themeStore.actualTheme` | 시스템 테마 감지 |

---

## 커밋 이력

| 커밋 | 내용 |
|------|------|
| `8110636` | Phase 1-2: 패키지 설정 + QueryClientProvider + Zustand 스토어 |
| `ff0e43d` | Phase 3-4: react-query Query/Mutation 훅 생성 |
| `ec83ea1` | Phase 5-8: Redux 완전 제거 + 기존 코드 전환 + 빌드 검증 |

---

## 생성 파일

| 파일 | 역할 |
|------|------|
| `src/store/authStore.ts` | 인증 클라이언트 상태 (isAuthenticated, isInitialized) |
| `src/store/themeStore.ts` | 테마 클라이언트 상태 |
| `src/components/common/ThemeInitializer.tsx` | 테마 DOM 사이드이펙트 처리 (렌더링 없는 컴포넌트) |
| `src/hooks/queries/useAuthInitialize.ts` | 앱 초기화 query |
| `src/hooks/queries/useMyProfile.ts` | 내 프로필 query (isAuthenticated 시 활성화) |
| `src/hooks/queries/useUsers.ts` | 사용자 목록 query (staleTime 2분) |
| `src/hooks/queries/useUserById.ts` | 사용자 상세 query |
| `src/hooks/mutations/useLogout.ts` | 로그아웃 mutation |
| `src/hooks/mutations/useUpdateMyProfile.ts` | 프로필 수정 mutation |
| `src/hooks/mutations/useChangePassword.ts` | 비밀번호 변경 mutation |
| `src/hooks/mutations/useDeleteMyAccount.ts` | 계정 삭제 mutation |

## 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `package.json` | @reduxjs/toolkit, react-redux 제거 / @tanstack/react-query, zustand 추가 |
| `src/components/providers/Providers.tsx` | Redux Provider 제거, QueryClientProvider + ThemeInitializer 추가 |
| `src/context/AuthContext.tsx` | Redux 제거, Zustand + react-query 기반으로 재구성 |
| `src/hooks/useAuth.ts` | useAppSelector/Dispatch 제거 → authStore + useAuthInitialize |
| `src/hooks/useUserProfile.ts` | Redux dispatch 제거 → useMyProfile + useQueryClient |
| `src/components/auth/AuthGuard.tsx` | isInitialized 조건 추가 (authStore) |
| `src/components/common/ThemeToggle.tsx` | useTheme(ThemeContext) → useThemeStore |

## 삭제 파일

| 파일 | 이유 |
|------|------|
| `src/store/index.ts` | Redux store 제거 |
| `src/store/hooks.ts` | useAppDispatch/useAppSelector 불필요 |
| `src/store/slices/authSlice.ts` | react-query + Zustand로 분리 |
| `src/store/slices/userSlice.ts` | react-query mutation/query로 대체 |
| `src/context/ThemeContext.tsx` | themeStore + ThemeInitializer로 대체 |

## 유지 파일 (변경 없음)

- `src/services/*` — 서비스 레이어
- `src/lib/httpClient.ts` — HTTP 클라이언트 (tokenManager 포함)
- `src/hooks/useAccessibility.ts` — 접근성 훅
- `src/components/common/*` — 공통 UI 컴포넌트 (FormField, Toast 등)
- `src/app/page.tsx` — 홈 페이지
- `src/app/profile/page.tsx` — 프로필 페이지
- `src/app/settings/page.tsx` — 설정 페이지
- `src/types/*` — 타입 정의

---

## 구현 시 계획 대비 실제 차이점

### useAuthInitialize
계획에서는 훅 내부에 `setAuthenticated`/`setInitialized` Zustand 호출을 포함했으나,
실제 구현에서는 훅은 query 반환만 담당하고, Zustand 동기화는 `AuthContext`의 `useEffect`에서 처리.
→ 훅의 단일 책임 원칙 유지.

### ThemeInitializer
시스템 테마 변경 핸들러에서 DOM 클래스(`classList`)도 함께 업데이트하도록 보강.
계획 코드는 `setActualTheme`만 호출했으나, DOM 반영이 누락될 수 있어 핸들러 내부에 classList 업데이트 추가.

### useUserProfile
계획의 `refetch` 구현이 placeholder 주석으로 작성되어 있었으나,
실제에서는 `useQueryClient` + `invalidateQueries(['myProfile'])` 로 완전 구현.

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
