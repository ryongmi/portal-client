# Portal Client

> KRGeobuk 통합 포털 클라이언트

krgeobuk 마이크로서비스 생태계의 사용자 포털로, 서비스 목록 조회, 사용자 인증, 프로필 관리를 제공합니다.

---

## 주요 기능

### 서비스 포탈
- **서비스 목록** - 접근 가능한 서비스 카드 그리드 표시
- **서비스 상태** - 공개 / 권한 기반 / 준비 중 구분 표시
- **서비스 통계** - 총 서비스, 공개 서비스, 권한 기반 서비스 수

### 인증
- **JWT 자동 갱신** - RefreshToken 기반 AccessToken 자동 갱신
- **인증 상태 초기화** - 페이지 새로고침 시 인증 상태 복원
- **OAuth 계정 연동** - Google, Naver 소셜 계정 표시

### 사용자 관리
- **프로필 조회/수정** - 사용자 정보, OAuth 연동 상태, 역할/권한 확인
- **다크 모드** - 시스템/수동 테마 전환
- **접근성** - ARIA 라벨, 키보드 네비게이션 지원

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router), TypeScript 5 |
| 상태 관리 | TanStack Query 5, Zustand 5, React Context |
| UI | Tailwind CSS 3, Lucide React |
| 폼 | React Hook Form 7 |
| HTTP | Axios 1.6 (`@krgeobuk/http-client` 래퍼) |
| 보안 | CSP, CSRF, Rate Limiting (미들웨어) |
| 인증 | JWT (AccessToken + RefreshToken 자동 갱신) |

---

## 빠른 시작

### 환경 요구사항
- Node.js 18+
- 실행 중인 백엔드 서비스 (auth-server, authz-server, portal-server)
- 공유 라이브러리 (`@krgeobuk/*`) 접근 가능한 NPM 레지스트리

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에서 실제 값으로 수정

# 3. 개발 서버 시작
npm run dev
```

서버가 http://localhost:3200 에서 실행됩니다.

### 스크립트

```bash
# 개발
npm run dev          # Next.js 개발 서버 (포트 3200)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작 (포트 3200)

# 코드 품질
npm run lint         # ESLint 검사
npm run type-check   # TypeScript 타입 검사
```

---

## 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 홈 (서비스 포탈)
│   ├── profile/page.tsx          # 사용자 프로필
│   ├── settings/page.tsx         # 설정
│   ├── help/page.tsx             # 도움말
│   ├── layout.tsx                # 루트 레이아웃
│   └── globals.css
│
├── components/
│   ├── auth/
│   │   └── AuthGuard.tsx         # 인증 보호 컴포넌트
│   ├── common/                   # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx / ToastContainer.tsx
│   │   ├── Table.tsx / Pagination.tsx
│   │   ├── SkeletonLoader.tsx / LoadingSpinner.tsx
│   │   ├── FormField.tsx
│   │   ├── ThemeToggle.tsx / ThemeInitializer.tsx
│   │   └── ErrorBoundary.tsx / ErrorMessage.tsx
│   ├── layout/
│   │   ├── Layout.tsx            # 메인 레이아웃 (Header + Sidebar)
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── SimpleLayout.tsx
│   ├── profile/
│   │   └── UserProfileCard.tsx
│   └── providers/
│       └── Providers.tsx         # 루트 프로바이더 (QueryClient, Auth)
│
├── context/
│   └── AuthContext.tsx           # 인증 Context (user, loading, logout)
│
├── hooks/
│   ├── queries/
│   │   ├── auth.ts               # useAuthInitialize, useMyProfile
│   │   └── keys.ts               # Query Key Factory
│   ├── mutations/
│   │   ├── auth.ts               # useLogout
│   │   └── users.ts              # useUpdateMyProfile 등
│   ├── useAuth.ts                # 인증 상태 훅
│   └── useUserProfile.ts         # 프로필 + 권한 훅
│
├── services/
│   ├── authService.ts            # 인증 API 호출
│   ├── userService.ts            # 사용자 API 호출
│   └── base/
│       └── BaseService.ts        # 공통 서비스 기반 클래스
│
├── store/
│   ├── authStore.ts              # Zustand 인증 상태 (isAuthenticated, isInitialized)
│   └── themeStore.ts             # Zustand 테마 상태
│
├── lib/
│   └── httpClient.ts             # Axios 인스턴스 (auth / authz / portal)
│
├── middleware.ts                 # 보안 미들웨어 (CSP, CSRF, Rate Limiting)
│
├── types/                        # 타입 정의
└── utils/                        # 유틸리티 (날짜, 폼 검증, 케이스 변환)
```

---

## 페이지 구조

| 경로 | 설명 | 인증 필요 |
|------|------|-----------|
| `/` | 서비스 포탈 홈 (서비스 목록/통계) | 선택적 |
| `/profile` | 사용자 프로필 조회/수정 | 필요 |
| `/settings` | 사용자 설정 | 필요 |
| `/help` | 도움말 | - |

---

## 연결 서버

| 서버 | 포트 | 용도 |
|------|------|------|
| auth-server | 8000 | 사용자 인증, 프로필, OAuth |
| authz-server | 8100 | 역할, 권한 조회 |
| portal-server | 8200 | 서비스 목록 조회 |

---

## 환경 변수

```bash
# ===== API 서버 =====
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000/api
NEXT_PUBLIC_AUTHZ_SERVER_URL=http://localhost:8100/api
NEXT_PUBLIC_PORTAL_SERVER_URL=http://localhost:8200/api
NEXT_PUBLIC_TOKEN_REFRESH_URL=http://localhost:8000/api/auth/refresh
NEXT_PUBLIC_PORTAL_CLIENT_URL=http://localhost:3200

# ===== 환경 =====
NEXT_PUBLIC_ENVIRONMENT=local
NODE_ENV=local
NEXT_TELEMETRY_DISABLED=1

# ===== 보안 =====
ALLOWED_ORIGINS=localhost,127.0.0.1
NEXT_PUBLIC_API_TIMEOUT=15000
NEXT_PUBLIC_RATE_LIMIT_MAX_ATTEMPTS=100
NEXT_PUBLIC_ENABLE_CSRF=true
NEXT_PUBLIC_ENABLE_INPUT_VALIDATION=true
NEXT_PUBLIC_ENABLE_SECURITY_LOGGING=true
```

전체 환경 변수 목록: `.env.example`

---

## 인증 흐름

```
앱 시작
  └─ AuthProvider (Providers.tsx)
       └─ useAuthInitialize()    # RefreshToken으로 AccessToken 복원
            ├─ 성공: isAuthenticated = true
            │         useMyProfile() 로 사용자 정보 로드
            └─ 실패: isAuthenticated = false (비로그인 상태)
```

**토큰 자동 갱신**: `@krgeobuk/http-client`가 만료 5분 전 자동 갱신

---

## 보안

`src/middleware.ts`에서 모든 요청에 보안 헤더를 적용합니다:

| 항목 | 내용 |
|------|------|
| CSP | 스크립트/리소스 출처 제한 |
| X-Frame-Options | 클릭재킹 방지 (`DENY`) |
| X-Content-Type-Options | MIME 스니핑 방지 |
| CSRF | POST/PUT/PATCH/DELETE 요청 Origin 검증 |
| Rate Limiting | IP 기반 분당 100 요청 제한 |
| HSTS | 프로덕션 HTTPS 강제 |

---

## 문서

| 파일 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 개발 가이드 (패턴, 표준, 워크플로우) |
| [docs/](./docs/) | 기능별 설계 문서 |
