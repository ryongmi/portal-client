# Portal-Client 공통 패키지 추출 계획

> 📅 **계획 수립일**: 2025-01-27  
> 🎯 **목표**: portal-client의 재사용 가능한 로직을 공통 패키지로 추출하여 다른 클라이언트 서비스에서 활용

## 📋 계획 개요

portal-client에서 UI와 로직을 분리하여, 다른 클라이언트 서비스에서도 활용할 수 있는 **로직 중심의 공통 패키지**를 추출합니다. 각 서비스의 UI/CSS 다양성을 고려하여 비즈니스 로직만 공유하는 안전한 접근법을 채택합니다.

### 핵심 원칙
1. **로직과 UI 분리** - 비즈니스 로직만 공유, UI는 각 서비스에서 구현
2. **커스터마이징 우선** - 하드코딩된 스타일 지양
3. **점진적 도입** - 위험이 낮고 가치가 높은 것부터 우선
4. **선택적 사용** - 각 서비스에서 필요한 패키지만 선택적으로 도입

## 🎯 추출 대상 패키지

### Phase 1: 즉시 구현 (안전하고 높은 가치) ✅

#### 1. `@krgeobuk/react-hooks` 🔥 **최우선**

**순수 로직 훅들 (UI 스타일 무관)**

**추출 대상:**
- `usePagination` - 페이징, 정렬, 필터링 로직
- `useLoadingState` - 다중 키 로딩 상태 관리
- `useTokenMonitor` & `useTokenRefresh` - JWT 관리 로직
- `useFocusManagement` - 접근성 포커스 관리 로직

**장점:**
- 모든 React 프로젝트에서 재사용 가능
- UI에 독립적인 순수 로직
- 즉시 도입 가능, 위험 없음

**사용 예시:**
```typescript
// 페이지네이션 로직 재사용
const { page, limit, sortBy, sortOrder, goToPage, changeSort } = usePagination({
  initialLimit: LimitType.TWENTY,
  initialSortBy: 'createdAt'
});

// 멀티 로딩 상태 관리
const { setLoading, isLoading, withLoading } = useLoadingState();
```

#### 2. `@krgeobuk/form-validation` 🔥 **최우선**

**폼 검증 로직 (UI 무관)**

**추출 대상:**
- 한국어 특화 검증 규칙 (전화번호, 한글, 이메일 등)
- React Hook Form 통합 유틸리티
- 서버 에러 매핑 함수 (`mapServerErrorsToFormErrors`)
- 비동기 검증 헬퍼 (`createAsyncValidator`)
- 커스텀 검증 함수들 (`customValidators`)

**장점:**
- 모든 폼에서 재사용 가능
- 한국 서비스 특화 기능 제공
- 검증된 보안 로직

**사용 예시:**
```typescript
// 검증 규칙 재사용
const { register, formState: { errors } } = useForm();

<input {...register('email', validationRules.email)} />
<input {...register('phone', validationRules.phone)} />

// 서버 에러 처리
const formErrors = mapServerErrorsToFormErrors(serverResponse.errors);
```

#### 3. `@krgeobuk/data-utils` 🔥 **최우선**

**데이터 변환 및 API 유틸리티**

**추출 대상:**
- `caseConverter.ts` - 카멜케이스/스네이크케이스 변환 유틸리티
- API 응답 타입 정의 (`ApiResponse<T>`, `PaginatedResponse<T>`)
- Redux 슬라이스 패턴 및 유틸리티

**장점:**
- 백엔드와의 일관된 데이터 통신
- 타입 안전성 보장
- 표준화된 API 패턴

**사용 예시:**
```typescript
// 케이스 변환
const camelData = convertKeysToCamel(snakeApiResponse);
const snakeData = convertKeysToSnake(camelFormData);

// 타입 안전한 API 응답 처리
const response: ApiResponse<User[]> = await api.get('/users');
```

#### 4. `@krgeobuk/auth-state` 🔑 **중요** (수정된 인증 패키지)

**인증 상태 관리 로직 (UI 없음)**

**추출 대상:**
- 인증 상태 관리 Context 및 Hook
- 라우트 보호 로직 (UI는 fallback으로 주입)
- JWT 토큰 관리 및 자동 갱신
- 세션 관리 훅

**별도 인증 클라이언트와의 관계:**
- **인증 클라이언트**: 로그인/회원가입 **UI 및 플로우** 담당
- **`@krgeobuk/auth-state`**: 인증 **상태 관리 로직** 담당
- 두 시스템이 완벽하게 협력하여 작동

**사용 예시:**
```typescript
// 라우트 보호 (UI는 각 서비스에서 커스텀)
<AuthGuard requireAuth fallback={<CustomLoadingUI />}>
  <ProtectedContent />
</AuthGuard>

// 인증 상태 관리
const { user, isAuthenticated, login, logout } = useAuth();

// 세션 관리
const { sessionValid, timeUntilExpiry, refreshSession } = useSession();
```

### Phase 2: 조건부 구현 (요청 시) 🤔

#### 5. `@krgeobuk/ui-headless` (필요시만)

**Headless UI 컴포넌트 (스타일 없음)**

**추출 후보:**
- 테이블 로직 (정렬, 페이징 상태만)
- 모달 상태 관리 및 키보드 이벤트
- 폼 필드 상태 관리

**사용 예시:**
```typescript
// 스타일 없는 순수 로직만
const { sortBy, sortOrder, handleSort } = useTableSort();
const { isOpen, open, close, containerRef } = useModal();
```

#### 6. `@krgeobuk/accessibility` (필요시만)

**접근성 유틸리티 (로직만)**

**추출 후보:**
- 키보드 네비게이션 헬퍼
- 스크린 리더 유틸리티  
- ARIA 속성 관리 훅

### 구현하지 않음 ❌

#### ❌ `@krgeobuk/ui-components` 
**이유:** 각 서비스마다 다른 디자인 시스템 가능성

#### ❌ `@krgeobuk/ui-theme`
**이유:** 서비스별 브랜딩 및 테마 차이

#### ❌ UI가 포함된 인증 컴포넌트
**이유:** 별도 인증 클라이언트에서 구현 예정

## 🗂️ 추출 소스 파일 매핑

### `@krgeobuk/react-hooks`
```
src/hooks/
├── usePagination.ts          → 추출 ✅
├── useLoadingState.ts        → 추출 ✅  
├── useTokenMonitor.ts        → 추출 ✅
├── useTokenRefresh.ts        → 추출 ✅
├── useFocusManagement.ts     → 추출 ✅
├── useAuth.ts                → @krgeobuk/auth-state로 이동
├── useErrorHandler.ts        → 검토 후 결정
└── useAccessibility.ts       → Phase 2에서 고려
```

### `@krgeobuk/form-validation`
```
src/utils/
└── formValidation.ts         → 전체 추출 ✅
```

### `@krgeobuk/data-utils`
```
src/utils/
├── caseConverter.ts          → 추출 ✅
└── security.ts               → 이미 처리 완료 (보안 패키지)

src/types/
├── api.ts                    → 추출 ✅
└── index.ts                  → 일부 추출 ✅
```

### `@krgeobuk/auth-state`
```
src/context/
└── AuthContext.tsx           → 추출 ✅

src/components/auth/
├── AuthGuard.tsx             → 로직만 추출 ✅
├── AuthProvider.tsx          → 로직만 추출 ✅
└── SessionManager.tsx        → 로직만 추출 ✅

src/hooks/
├── useAuth.ts                → 추출 ✅
├── useTokenMonitor.ts        → 추출 ✅
└── useTokenRefresh.ts        → 추출 ✅
```

## 📅 실행 로드맵

### 사전 작업 (현재)
- [ ] 다른 클라이언트 서비스 분리 완료 대기
- [ ] 별도 인증 클라이언트 구축 완료 대기
- [x] 추출 계획 문서화 완료

### Phase 1 실행 (즉시 가능)
1. **패키지 구조 생성**
   ```
   shared-lib/packages/
   ├── react-hooks/
   ├── form-validation/
   ├── data-utils/
   └── auth-state/
   ```

2. **각 패키지별 작업**
   - [ ] `@krgeobuk/react-hooks` 생성 및 훅 이동
   - [ ] `@krgeobuk/form-validation` 생성 및 검증 로직 이동
   - [ ] `@krgeobuk/data-utils` 생성 및 유틸리티 이동
   - [ ] `@krgeobuk/auth-state` 생성 및 인증 로직 이동

3. **portal-client 업데이트**
   - [ ] 새로운 패키지들을 dependencies에 추가
   - [ ] import 경로를 공통 패키지로 변경
   - [ ] 기존 파일들을 제거 또는 정리

4. **테스트 및 검증**
   - [ ] 기존 기능 정상 동작 확인
   - [ ] 타입 검사 통과 확인
   - [ ] 빌드 성공 확인

### Phase 2 실행 (요청 시)
- [ ] `@krgeobuk/ui-headless` 구현
- [ ] `@krgeobuk/accessibility` 구현

## 📈 기대 효과

### 즉시 얻을 수 있는 이점
1. **개발 속도 향상** - 검증된 로직 재사용으로 새 서비스 개발 시간 단축
2. **일관된 데이터 처리** - 표준화된 API 패턴 및 데이터 변환
3. **한국 특화 기능** - 전화번호, 한글 검증 등 로컬라이제이션 기능
4. **보안 강화** - 검증된 인증 로직 및 폼 검증

### 위험 최소화
1. **UI 독립성** - 각 서비스의 디자인 자유도 보장
2. **점진적 도입** - 선택적 사용 가능, 강제성 없음
3. **하위 호환성** - 기존 코드에 영향 없는 안전한 마이그레이션
4. **롤백 용이성** - 언제든 원래 상태로 복구 가능

## 🔍 주의사항

### 실행 전 확인사항
1. **다른 클라이언트 분리 완료** - 추출할 로직의 범위 명확화
2. **인증 클라이언트 구축 완료** - 인증 패키지 역할 재정의
3. **각 서비스의 요구사항 파악** - 실제 필요한 패키지 우선순위 결정

### 추출 시 고려사항
1. **종속성 최소화** - 각 패키지간 의존성을 최소한으로 유지
2. **타입 안전성** - TypeScript 엄격 모드 준수
3. **문서화** - 각 패키지별 사용법 및 예제 제공
4. **버전 관리** - semantic versioning 적용

## 📞 실행 시점

이 계획은 다음 조건이 충족된 후 실행됩니다:

1. ✅ **다른 클라이언트 서비스 분리 완료**
2. ✅ **별도 인증 클라이언트 구축 완료**
3. ✅ **각 서비스별 요구사항 명확화**

위 조건 충족 시, 본 계획에 따라 공통 패키지 추출 작업을 진행할 예정입니다.

---

> 📝 **문서 관리**  
> - 최초 작성: 2025-01-27
> - 마지막 업데이트: 2025-01-27
> - 작성자: Claude Code
> - 상태: 대기 중 (사전 조건 충족 시 실행)