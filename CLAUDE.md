# CLAUDE.md - Portal Client

이 파일은 portal-client 작업 시 Claude Code의 가이드라인을 제공합니다.

## 프로젝트 개요

portal-client는 krgeobuk 생태계를 위한 통합 포털 클라이언트로, Next.js 15로 구축된 현대적인 웹 애플리케이션입니다. 완전한 사용자 인증 시스템, 고급 관리자 인터페이스, 그리고 반응형 사용자 경험을 제공합니다.

### 기술 스택
- **Next.js 15** - App Router 기반 React 프레임워크  
- **TypeScript** - 엄격 모드가 활성화된 완전한 타입 안전성
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **React Hook Form** - 성능 최적화된 폼 관리
- **Axios** - HTTP 클라이언트

## 핵심 명령어

### 개발
```bash
# 개발 서버 시작
npm run dev                # Next.js 개발 서버 (포트 3000)

# 빌드
npm run build              # 프로덕션 빌드
npm run start              # 프로덕션 서버 시작

# 타입 검사
npm run type-check         # TypeScript 타입 검사
```

### 코드 품질
```bash
# 린팅
npm run lint               # ESLint 실행
```

## 아키텍처 구조

### 프론트엔드 구조
- **Next.js 15 App Router**: 최신 React 패턴 활용
- **TypeScript 엄격 모드**: 완전한 타입 안전성
- **Tailwind CSS**: 유틸리티 우선 CSS, 그라데이션 테마
- **React Hook Form**: 성능 최적화된 폼 관리
- **경로 별칭**: `@/*` → `./src/*`

### 서비스 통합 아키텍처
portal-client는 krgeobuk 마이크로서비스 생태계의 통합 관리 인터페이스입니다:

1. **auth-server** - 사용자 인증 및 OAuth 관리
2. **authz-server** - 역할 및 권한 관리  
3. **portal-server** - 서비스 통합 및 포탈 관리

### 관리자 인터페이스 구조
`/admin` 라우트 하위의 중첩 페이지 구조:
- **사용자 관리** (`/admin/auth/users`)
- **OAuth 클라이언트 관리** (`/admin/auth/oauth`)
- **역할 관리** (`/admin/authorization/roles`)
- **권한 관리** (`/admin/authorization/permissions`)
- **서비스 관리** (`/admin/portal/services`)

---

# 🔥 Next.js 15 & React 개발 표준

> **중요**: 이 섹션은 krgeobuk 생태계의 **모든 Next.js 및 React 개발**에서 적용되는 표준입니다.

## 컴포넌트 아키텍처 패턴

### 1. 디렉터리 구조 표준
```
src/
├── app/                    # Next.js 15 App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── admin/             # 관리자 인터페이스
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── common/           # 공통 UI 컴포넌트
│   ├── forms/            # 폼 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── hooks/                # 커스텀 훅
├── services/             # API 서비스 레이어
├── types/                # TypeScript 타입 정의
├── utils/                # 유틸리티 함수
└── context/              # React Context
```

### 2. 컴포넌트 분류 및 네이밍

#### Common 컴포넌트 (재사용 가능한 UI)
```typescript
// src/components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2',
        variantStyles[variant],
        sizeStyles[size]
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### Layout 컴포넌트 (구조적 레이아웃)
```typescript
// src/components/layout/Layout.tsx
interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

#### Form 컴포넌트 (특화된 폼)
```typescript
// src/components/forms/RoleForm.tsx
interface RoleFormProps {
  role?: Role;
  onSubmit: (data: CreateRoleDto | UpdateRoleDto) => void;
  onCancel: () => void;
}

export const RoleForm: React.FC<RoleFormProps> = ({ role, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RoleFormData>();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 폼 필드들 */}
    </form>
  );
};
```

## React Hook Form 표준 패턴

### 1. 폼 훅 설정 표준
```typescript
// 기본 폼 설정
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  reset,
  watch,
  setValue
} = useForm<FormData>({
  defaultValues: {
    // 기본값 설정
  },
  mode: 'onChange', // 실시간 검증
});
```

### 2. 폼 검증 패턴
```typescript
// 검증 규칙 정의
const validationRules = {
  email: {
    required: '이메일을 입력해주세요',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: '올바른 이메일 형식을 입력해주세요'
    }
  },
  password: {
    required: '비밀번호를 입력해주세요',
    minLength: {
      value: 8,
      message: '비밀번호는 최소 8자 이상이어야 합니다'
    }
  }
};

// 입력 필드 구현
<input
  {...register('email', validationRules.email)}
  className={cn(
    'w-full px-3 py-2 border rounded-md',
    errors.email ? 'border-red-500' : 'border-gray-300'
  )}
/>
{errors.email && (
  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
)}
```

### 3. 폼 제출 패턴
```typescript
const onSubmit = async (data: FormData) => {
  try {
    setIsLoading(true);
    await apiService.create(data);
    reset(); // 폼 초기화
    onSuccess?.();
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

## 커스텀 훅 표준

### 1. API 연동 훅 패턴
```typescript
// src/hooks/useUsers.ts
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (params?: SearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(params);
      setUsers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};
```

### 2. 페이지네이션 훅 패턴
```typescript
// src/hooks/usePagination.ts
export const usePagination = <T>(
  fetchFunction: (params: SearchParams) => Promise<PaginatedResponse<T>>,
  initialParams: SearchParams = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PageInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState(initialParams);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchFunction({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      setData(response.data);
      setPagination(response.pageInfo);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, filters, pagination.currentPage, pagination.itemsPerPage]);

  return {
    data,
    pagination,
    filters,
    loading,
    setFilters,
    setCurrentPage: (page: number) => 
      setPagination(prev => ({ ...prev, currentPage: page })),
    refetch: loadData
  };
};
```

## Tailwind CSS 디자인 시스템

### 1. 색상 팔레트 표준
```typescript
// 주요 색상 시스템
const colors = {
  // 기본 그라데이션
  background: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  
  // 카드 및 컨테이너
  card: 'bg-white/90 backdrop-blur-sm',
  cardHover: 'hover:bg-white/95',
  
  // 버튼 스타일
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  
  // 텍스트
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-400'
};
```

### 2. 스페이싱 및 레이아웃 표준
```typescript
// 표준 스페이싱
const spacing = {
  section: 'space-y-6',         // 섹션 간 간격
  card: 'p-6',                  // 카드 내부 패딩
  form: 'space-y-4',            // 폼 요소 간격
  button: 'px-4 py-2',          // 버튼 패딩
  modal: 'p-6 max-w-2xl',       // 모달 스타일
};

// 반응형 그리드
const grid = {
  responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  table: 'grid grid-cols-1 gap-4 sm:gap-6',
  form: 'grid grid-cols-1 md:grid-cols-2 gap-4'
};
```

### 3. 애니메이션 및 트랜지션
```typescript
// 표준 트랜지션
const transitions = {
  default: 'transition-all duration-200 ease-in-out',
  hover: 'transform hover:scale-105 transition-transform duration-200',
  fade: 'transition-opacity duration-300',
  slide: 'transition-transform duration-300 ease-in-out'
};
```

## TypeScript 타입 안전성 표준

### 1. API 응답 타입 정의
```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  code: string;
  status_code: number;
  message: string;
  isLogin: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface PageInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
```

### 2. 도메인 모델 타입
```typescript
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  priority: number;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  action: string;
  description: string;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. 폼 데이터 타입
```typescript
// src/types/forms.ts
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phoneNumber?: string;
  agreeToTerms: boolean;
}

export interface RoleFormData {
  name: string;
  description: string;
  priority: number;
  serviceId: string;
}
```

## 서비스 레이어 패턴

### 1. API 서비스 구조
```typescript
// src/services/userService.ts
import { httpClient } from '@/lib/httpClient';
import type { User, CreateUserDto, UpdateUserDto, SearchParams } from '@/types';

export const userService = {
  async getUsers(params?: SearchParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: CreateUserDto): Promise<void> {
    await apiClient.post('/users', userData);
  },

  async updateUser(id: string, userData: UpdateUserDto): Promise<void> {
    await apiClient.patch(`/users/${id}`, userData);
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }
};
```

### 2. Axios 설정 표준
```typescript
// src/lib/axios.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터  
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
      localStorage.removeItem('accessToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

## 성능 최적화 표준

### 1. 메모이제이션 패턴
```typescript
// React.memo로 불필요한 리렌더링 방지
export const UserCard = React.memo<UserCardProps>(({ user, onEdit, onDelete }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6">
      {/* 사용자 카드 내용 */}
    </div>
  );
});

// useMemo로 계산 비용이 큰 값 캐싱
const filteredUsers = useMemo(() => {
  return users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [users, searchTerm]);

// useCallback으로 함수 참조 안정화
const handleUserUpdate = useCallback((userData: UpdateUserDto) => {
  return userService.updateUser(selectedUser.id, userData);
}, [selectedUser.id]);
```

### 2. 지연 로딩 패턴
```typescript
// 동적 import를 통한 컴포넌트 지연 로딩
const UserDetailModal = lazy(() => import('@/components/modals/UserDetailModal'));
const RolePermissionModal = lazy(() => import('@/components/modals/RolePermissionModal'));

// 조건부 렌더링으로 성능 최적화
{showModal && (
  <Suspense fallback={<LoadingSpinner />}>
    <UserDetailModal user={selectedUser} onClose={() => setShowModal(false)} />
  </Suspense>
)}
```

## 상태 관리 패턴

### 1. 로컬 상태 관리
```typescript
// 컴포넌트 로컬 상태
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [selectedUser, setSelectedUser] = useState<User | null>(null);

// UI 상태 관리
const [showModal, setShowModal] = useState(false);
const [activeTab, setActiveTab] = useState<'basic' | 'permissions'>('basic');
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
```

### 2. Context API 패턴
```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 서비스 가시성 관리

### 서비스 가시성 플래그
서비스는 두 가지 플래그를 통해 포탈에서의 가시성을 제어합니다:

- **`isVisible`**: 포탈에서 표시 여부
- **`isVisibleByRole`**: 권한 기반 표시 여부

### 가시성 조건
- **비공개** (`isVisible = false`): 관리자만 볼 수 있음, 포탈 사용자는 접근 불가
- **공개** (`isVisible = true && isVisibleByRole = false`): 모든 포탈 사용자가 접근 가능
- **권한 기반** (`isVisible = true && isVisibleByRole = true`): 특정 역할을 가진 사용자만 접근 가능

## 개발 체크리스트

### 컴포넌트 개발
- [ ] TypeScript 타입 완전성 (모든 props, state 타입 정의)
- [ ] React.memo 적용 (불필요한 리렌더링 방지)
- [ ] 접근성 고려 (ARIA 라벨, 키보드 네비게이션)
- [ ] 반응형 디자인 (모바일 우선 접근법)
- [ ] 에러 바운더리 적용

### 폼 개발
- [ ] React Hook Form 사용
- [ ] 실시간 검증 구현
- [ ] 로딩 상태 관리
- [ ] 에러 처리 및 사용자 피드백
- [ ] 접근성 (레이블, 에러 메시지)

### 성능 최적화
- [ ] 불필요한 리렌더링 방지 (memo, useMemo, useCallback)
- [ ] 지연 로딩 구현 (lazy loading)
- [ ] 번들 크기 최적화 (트리 셰이킹)
- [ ] 이미지 최적화 (Next.js Image 컴포넌트)

### 코드 품질
- [ ] ESLint 규칙 준수
- [ ] TypeScript 엄격 모드 통과
- [ ] 컴포넌트 및 함수 네이밍 일관성
- [ ] 주석 및 문서화 (복잡한 로직)

### 사용자 경험
- [ ] 로딩 상태 시각적 피드백
- [ ] 에러 상태 사용자 친화적 메시지
- [ ] 호버 및 포커스 상태 구현
- [ ] 키보드 네비게이션 지원

## API 응답 포맷 통합

portal-client는 krgeobuk 백엔드 서비스들과의 일관된 통신을 위해 표준화된 API 응답 포맷을 사용합니다.

상세한 API 응답 포맷 표준은 [authz-server/CLAUDE.md](../authz-server/CLAUDE.md)의 **"API 응답 포맷 표준"** 섹션을 참조하세요.

### 클라이언트 사이드 구현
```typescript
// API 응답 타입 활용
interface ApiResponse<T> {
  code: string;
  status_code: number;
  message: string;
  isLogin: boolean;
  data: T;
}

// 서비스에서 응답 처리
const response = await apiClient.get<ApiResponse<User[]>>('/users');
const users = response.data.data; // 실제 데이터 추출
```