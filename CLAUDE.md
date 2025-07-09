# CLAUDE.md

이 파일은 이 저장소의 코드 작업 시 Claude Code (claude.ai/code)에게 지침을 제공합니다.

## 개발 명령어

- `npm run dev` - 개발 서버 시작
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 시작
- `npm run lint` - ESLint 실행
- `npm run type-check` - 파일 출력 없이 TypeScript 타입 검사 실행

## 아키텍처 개요

이 애플리케이션은 KRGeobuk 서비스 생태계를 위한 포탈 클라이언트 역할을 하는 Next.js 15 애플리케이션입니다. 사용자, 역할, 권한, 서비스 관리를 위한 공개 포탈과 관리자 인터페이스를 모두 제공합니다.

### 주요 아키텍처 구성 요소

**프론트엔드 구조:**
- Next.js 15 App Router로 구축
- 엄격 모드가 활성화된 TypeScript
- 스타일링을 위한 Tailwind CSS
- `@krgeobuk/eslint-config`를 확장하는 커스텀 ESLint 설정

**서비스 아키텍처:**
이 애플리케이션은 3개의 주요 서비스로 구성된 마이크로서비스 생태계를 관리하도록 설계되었습니다:
1. **인증 서비스** (`auth-service`) - 사용자 인증 및 OAuth 관리
2. **인가 서비스** (`authz-service`) - 역할 및 권한 관리
3. **포탈 서비스** (`portal-service`) - 서비스 통합 및 포탈 관리

**데이터 모델:**
핵심 엔티티는 User, Role, Permission, Service, UserRole, RolePermission, ServiceVisibleRole이며 `src/types/`에서 적절한 TypeScript 인터페이스로 정의됩니다.

**관리자 인터페이스:**
`/admin` 라우트 하위에 위치하며 다음과 같은 중첩 페이지들을 포함합니다:
- 사용자 관리 (`/admin/auth/users`)
- OAuth 클라이언트 관리 (`/admin/auth/oauth`)
- 역할 관리 (`/admin/authorization/roles`)
- 권한 관리 (`/admin/authorization/permissions`)
- 서비스 관리 (`/admin/portal/services`)

**컴포넌트 구조:**
- `src/components/common/` - 재사용 가능한 UI 컴포넌트 (Button, Modal, Table, Pagination, SearchFilters)
- `src/components/layout/` - 레이아웃 컴포넌트 (Header, Sidebar, Layout wrapper)
- `src/hooks/`의 커스텀 훅 (현재 usePagination 포함)

**경로 별칭:**
- `@/*`는 더 깔끔한 import를 위해 `./src/*`로 매핑됩니다

**목 데이터:**
개발/테스트 목적으로 현재 `src/data/mockData.ts`의 목 데이터를 사용합니다.

## 개발 참고사항

**언어:** 애플리케이션에는 한국어 지원이 내장되어 있습니다 (루트 레이아웃에서 lang="ko")

**스타일링:** globals.css에서 정의된 커스텀 색상 변수(--background, --foreground)와 함께 Tailwind CSS를 사용합니다

**타입 안전성:** 모든 컴포넌트는 적절한 JSX.Element 반환 타입을 포함하여 TypeScript 인터페이스로 완전히 타입화되어 있습니다

**서비스 가시성 관리:**
서비스는 두 가지 플래그를 통해 포탈에서의 가시성을 제어합니다:
- `isVisible`: 포탈에서 표시 여부
- `isVisibleByRole`: 권한 기반 표시 여부

가시성 조건:
- **비공개** (`isVisible = false`): 관리자만 볼 수 있음, 포탈 사용자는 접근 불가
- **공개** (`isVisible = true && isVisibleByRole = false`): 모든 포탈 사용자가 접근 가능
- **권한 기반** (`isVisible = true && isVisibleByRole = true`): 특정 역할을 가진 사용자만 접근 가능

**관리자 인터페이스 통합:**
중간 테이블 관리는 각 주 엔티티 페이지에 통합되어 있습니다:
- 사용자 관리에서 역할 할당 (UserRole 관리)
- 역할 관리에서 권한 설정 (RolePermission 관리)
- 서비스 관리에서 가시성 설정 (ServiceVisibleRole 관리)