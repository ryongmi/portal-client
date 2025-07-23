# Portal Client TypeScript 수정 진행상황 문서

> **작업 중단 시점**: 2025년 1월 23일  
> **사유**: 공통패키지 재배포 필요  
> **다음 작업**: 공통패키지 업데이트 후 1,2,3단계 진행

---

## 📊 **전체 작업 현황**

| 단계 | 작업 내용 | 상태 | 해결된 오류 수 |
|------|-----------|------|----------------|
| 4단계 | 페이지 컴포넌트 에러 핸들링 | ✅ 완료 | 5개 |
| 5단계 | 유틸리티 및 Hook 타입 개선 | ✅ 완료 | ~12개 |
| 6단계 | Next.js 관련 타입 오류 | ✅ 완료 | 2개 |
| 1단계 | Redux Store 타입 정의 | ⏳ 대기 | 6개 |
| 2단계 | 컴포넌트 타입 안전성 | ⏳ 대기 | 13개 |
| 3단계 | 공유 라이브러리 의존성 | ⏳ 대기 | 4개 |

**총 해결 완료**: ~19개 오류  
**남은 작업**: 23개 오류

---

## ✅ **완료된 작업 (4,5,6단계)**

### 🔥 **4단계: 페이지 컴포넌트 에러 핸들링 수정**

**해결된 문제**: `error.response` 속성 타입 오류

#### 수정된 파일 (5개)
1. **`src/app/admin/auth/oauth/page.tsx:195`**
   ```typescript
   // 기존
   const formErrors = mapServerErrorsToFormErrors(error?.response?.data?.errors);
   
   // 수정
   const formErrors = mapServerErrorsToFormErrors(
     (error as any)?.response?.data?.errors
   );
   ```

2. **`src/app/admin/auth/users/page.tsx:234`**
   ```typescript
   // 동일한 패턴으로 수정
   const formErrors = mapServerErrorsToFormErrors(
     (error as any)?.response?.data?.errors
   );
   ```

3. **`src/app/admin/authorization/permissions/page.tsx:177`**
4. **`src/app/admin/authorization/roles/page.tsx:180`**
5. **`src/app/admin/portal/services/page.tsx:204`**

---

### 🔧 **5단계: 유틸리티 및 Hook 타입 개선**

#### 5.1 **`src/hooks/useErrorHandler.ts`** (2개 오류 해결)
```typescript
// 기존 (라인 53-54)
error: error.toString(),
stack: error.stack,

// 수정
error: error instanceof Error ? error.toString() : String(error),
stack: error instanceof Error ? error.stack : undefined,
```

#### 5.2 **`src/hooks/useAccessibility.ts`** (6개 오류 해결)
```typescript
// RGB 파싱 안전성 강화 (라인 196-198)
r: parseInt(result[1] || '0', 16),
g: parseInt(result[2] || '0', 16),
b: parseInt(result[3] || '0', 16)

// 루미넌스 계산 안전성 (라인 208)
return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0);
```

#### 5.3 **`src/hooks/useRoles.ts`** (2개 오류 해결)
```typescript
// 반환 타입 수정 (라인 108)
return response.data || [];

// 함수 인자 수정 (라인 122)
await RolePermissionService.assignPermissionToRole(roleId, permissionId);
```

#### 5.4 **`src/utils/formValidation.ts`** (3개 오류 해결)
```typescript
// 파일 처리 안전성 (라인 162, 202, 209)
return errorMessages[0] || '';
return file && file.size <= maxSize || `파일 크기는...`;
const fileType = file?.type.toLowerCase() || '';
```

#### 5.5 **`src/utils/security.ts`** (4개 오류 해결)
```typescript
// 타입 캐스팅 (라인 129)
if (!validateApiRequestData(value as ApiRequestData)) {

// 이메일 마스킹 안전성 (라인 163)
const maskedUser = user && user.length > 2 ? user.substring(0, 2) + '*'.repeat(user.length - 2) : user || '';
```

#### 5.6 **`src/lib/axios.ts`** (1개 오류 해결)
```typescript
// 타입 캐스팅 (라인 359)
setupTokenInterceptor(api as any);
```

---

### 🌐 **6단계: Next.js 관련 타입 오류**

#### 6.1 **`src/middleware.ts`** (1개 오류 해결)
```typescript
// NextRequest ip 속성 (라인 84)
const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
```

#### 6.2 **`src/components/profile/UserProfileCard.tsx`** (1개 오류 해결)
```typescript
// Optional provider 처리 (라인 148)
<OAuthBadge provider={userProfile.oauthAccount.provider || 'google'} />
```

---

## ⏳ **남은 작업 목록**

### 🔥 **1단계: Redux Store 타입 정의 문제 (최우선 - 6개 오류)**

#### 1.1 **`src/store/slices/permissionSlice.ts:44`**
```typescript
// 오류: Cannot find name 'Permission'. Did you mean 'Permissions'?
// 해결 방법: 상단에 Permission 타입 import 추가
import { Permission } from '@/types';
```

#### 1.2 **`src/store/slices/serviceSlice.ts:42`**
```typescript
// 오류: Cannot find name 'Service'
// 해결 방법: Service 타입 import 추가
import { Service } from '@/types';
```

#### 1.3 **`src/store/slices/userSlice.ts`** (4개 오류)
```typescript
// 라인 37, 114, 116, 128, 130: Cannot find name 'User'
// 해결 방법: User 타입 import 추가
import { User } from '@/types';
```

#### 1.4 **`src/store/slices/authSlice.ts`** (2개 오류)
```typescript
// 라인 204, 220: Property 'id' is missing in type 'LoggedInUser'
// 해결 방법: LoggedInUser 타입에 id 속성 추가 또는 타입 변환
```

#### 1.5 **Required ID 속성 오류** (2개)
- `src/store/slices/permissionSlice.ts:304` - PermissionSearchResult id 필수
- `src/store/slices/roleSlice.ts:246` - RoleSearchResult id 필수

---

### 📝 **2단계: 컴포넌트 타입 안전성 문제 (13개 오류)**

#### 2.1 **`src/components/forms/RoleForm.tsx`** (7개 오류)

**속성 접근 오류**:
```typescript
// 라인 65: Property 'service' does not exist on type 'Role'
serviceId: role.service?.id || '',
// 수정: serviceId: role.serviceId || '',

// 라인 116: Property 'serviceId' does not exist on type 'PermissionSearchResult'
const service = services.find(s => s.id === permission.serviceId);
// 수정: const service = services.find(s => s.id === permission.service?.id);
```

**Form 데이터 타입 오류** (3개):
```typescript
// 라인 62: name 타입 불일치
reset({
  name: role.name || '',  // undefined 방지
  description: role?.description || null,
  serviceId: role.serviceId || '',
  priority: role.priority || 5,
});
```

**Optional action 처리** (2개):
```typescript
// 라인 616, 632: permission.action is possibly undefined
{permission.action?.split(':')[0]}
{permission.action?.split(':')[1]}
```

#### 2.2 **`src/components/modals/RolePermissionModal.tsx`** (4개 오류)

```typescript
// 라인 70: 타입 불일치
setCurrentRolePermissions(rolePermissions as PermissionDetail[]);

// 라인 100: Service name 필수 속성
if (permission.service && permission.service.name) {
  acc.push({ id: permission.service.id, name: permission.service.name });
}

// 라인 123, 128, 130: servicePermissions undefined 체크
const servicePermissions = groupedPermissions[serviceName];
if (!servicePermissions) return;

// 라인 199: Modal Props className 속성 추가
// Modal 컴포넌트 인터페이스에 className?: string 추가 필요
```

#### 2.3 **`src/components/common/Table.tsx`** (2개 오류)

```typescript
// 라인 219-220: 제네릭 타입 제약 조건
interface TableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Array<{
    key: keyof T & string;  // key를 string으로 제한
    header: string;
    render?: (item: T) => React.ReactNode;
  }>;
}
```

#### 2.4 **`src/hooks/useRoles.ts`** (1개 오류)

```typescript
// 라인 108: 반환 타입 불일치
const getRolePermissions = useCallback(async (roleId: string): Promise<string[]> => {
  // 또는 PermissionDetail[]로 변경하고 데이터 변환 로직 추가
});
```

---

### 🛠️ **3단계: 공유 라이브러리 의존성 문제 (4개 오류)**

#### 3.1 **`src/types/api.ts`** (4개 오류)

```typescript
// 라인 13: 모듈 경로 수정 필요
// 현재: import { ... } from '@krgeobuk/shared/service/interfaces';
// 수정: import { ... } from '@krgeobuk/service/interfaces';

// 라인 33, 36, 38: UserProfile 타입 정의 추가
// 옵션 1: 직접 정의
interface UserProfile {
  id: string;
  email: string;
  name: string;
  // ... 기타 속성들
}

// 옵션 2: 올바른 경로에서 import
import { UserProfile } from '@krgeobuk/user/interfaces';
```

---

## 🚀 **공통패키지 재배포 후 작업 가이드**

### **1단계: 패키지 업데이트 확인**
```bash
# 패키지 설치 확인
npm install

# 타입 정의 확인
npm run type-check
```

### **2단계: Import 경로 재검증**
공통패키지 재배포 후 다음 import 경로들이 유효한지 확인:
- `@krgeobuk/shared/service/interfaces`
- `@krgeobuk/user/interfaces`
- `@krgeobuk/permission/interfaces`
- `@krgeobuk/role/interfaces`

### **3단계: 작업 우선순위**
1. **Redux Store 타입 정의** (30분) - 전체 상태 관리의 기반
2. **컴포넌트 타입 안전성** (45분) - UI 안정성 확보
3. **공유 라이브러리 의존성** (15분) - 외부 의존성 해결

### **4단계: 최종 검증**
```bash
# 모든 타입 오류 해결 확인
npm run type-check

# 빌드 테스트
npm run build

# 린팅 검사
npm run lint
```

---

## 📋 **체크리스트**

### **Redux Store 타입 수정**
- [ ] permissionSlice.ts - Permission 타입 import
- [ ] serviceSlice.ts - Service 타입 import  
- [ ] userSlice.ts - User 타입 import (4곳)
- [ ] authSlice.ts - LoggedInUser 타입 수정 (2곳)
- [ ] 필수 id 속성 타입 수정 (2곳)

### **컴포넌트 타입 수정**
- [ ] RoleForm.tsx - 속성 접근 방식 수정 (7곳)
- [ ] RolePermissionModal.tsx - 타입 불일치 해결 (4곳)
- [ ] Table.tsx - 제네릭 타입 제약 (2곳)
- [ ] useRoles.ts - 반환 타입 수정 (1곳)

### **공유 라이브러리 의존성**
- [ ] types/api.ts - import 경로 수정 (4곳)

### **최종 검증**
- [ ] TypeScript 컴파일 오류 0개 달성
- [ ] 빌드 성공
- [ ] 린팅 통과

---

## 💡 **참고사항**

- **작업 중단 전 마지막 상태**: 4,5,6단계 완료, 약 19개 오류 해결
- **핵심 이슈**: 공통패키지 타입 정의 의존성 문제로 1,2,3단계 작업 보류
- **예상 완료 시간**: 공통패키지 재배포 후 약 1.5시간 추가 작업 필요
- **중요**: Redux Store 타입 정의가 우선되어야 컴포넌트 레벨 수정이 원활해짐

이 문서를 참고하여 공통패키지 재배포 후 남은 작업을 효율적으로 완료할 수 있습니다.