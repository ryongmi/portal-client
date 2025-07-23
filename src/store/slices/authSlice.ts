import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/lib/axios';
import { tokenManager } from '@/utils/tokenManager';
import type { 
  User, 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  RefreshResponse
} from '@/types';
import type { ApiResponse } from '@/types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// 로그인 비동기 액션
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      const { accessToken, user } = response.data.data;
      
      tokenManager.setAccessToken(accessToken);
      return { accessToken, user };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || '로그인에 실패했습니다.');
    }
  }
);

// 회원가입 비동기 액션
export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData: SignupRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.post<ApiResponse<LoginResponse>>('/auth/signup', userData);
      const { accessToken, user } = response.data.data;
      
      tokenManager.setAccessToken(accessToken);
      return { accessToken, user };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || '회원가입에 실패했습니다.');
    }
  }
);

// 로그아웃 비동기 액션
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.post('/auth/logout');
      tokenManager.clearAccessToken();
      return null;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      tokenManager.clearAccessToken();
      return rejectWithValue(axiosError.response?.data?.message || '로그아웃에 실패했습니다.');
    }
  }
);

// 토큰 갱신 비동기 액션
export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.post<ApiResponse<RefreshResponse>>('/auth/refresh');
      const { accessToken } = response.data.data;
      
      // 이벤트 발행 없이 토큰 설정 (순환 참조 방지)
      tokenManager.setAccessTokenSilent(accessToken);
      return { accessToken };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      tokenManager.clearAccessToken();
      return rejectWithValue(axiosError.response?.data?.message || '토큰 갱신에 실패했습니다.');
    }
  }
);

// 사용자 정보 조회 비동기 액션
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.get<ApiResponse<User>>('/users/me');
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || '사용자 정보를 불러올 수 없습니다.');
    }
  }
);

// OAuth 로그인 토큰 설정 액션 (이벤트 발행 없이)
export const setOAuthToken = createAsyncThunk(
  'auth/setOAuthToken',
  async (accessToken: string, { dispatch }) => {
    // 이벤트 발행을 하지 않고 직접 토큰 설정
    tokenManager.setAccessTokenSilent(accessToken);
    
    // 토큰 설정 후 사용자 정보 조회
    const userResponse = await dispatch(fetchUserProfile()).unwrap();
    return { accessToken, user: userResponse };
  }
);

// 앱 초기화 비동기 액션 (리프레시 토큰 우선 처리)
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue, dispatch, getState }) => {
    // 이미 초기화되었거나 진행 중이면 현재 상태 반환
    const currentState = getState() as { auth: AuthState };
    if (currentState.auth.isInitialized) {
      return { 
        accessToken: currentState.auth.accessToken, 
        user: currentState.auth.user 
      };
    }

    try {
      // 1. 메모리의 토큰 확인
      const token = tokenManager.getAccessToken();
      if (token) {
        const response = await authApi.get<ApiResponse<User>>('/users/me');
        return { accessToken: token, user: response.data.data };
      }

      // 2. 액세스 토큰이 없으면 리프레시 토큰으로 갱신 시도
      try {
        const refreshResult = await dispatch(refreshToken()).unwrap();
        const newToken = refreshResult.accessToken;
        
        // 3. 새 토큰으로 사용자 정보 조회
        const response = await authApi.get<ApiResponse<User>>('/users/me');
        return { accessToken: newToken, user: response.data.data };
      } catch (refreshError) {
        // 4. 리프레시 실패 시 인증되지 않은 상태
        // 리프레시 토큰이 없거나 만료됨
        return { accessToken: null, user: null };
      }
    } catch (error: unknown) {
      // 5. 전체 프로세스 실패
      tokenManager.clearAccessToken();
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || '인증 초기화에 실패했습니다.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      tokenManager.setAccessToken(action.payload);
    },
    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      tokenManager.clearAccessToken();
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // 로그인
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 회원가입
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 로그아웃
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // 토큰 갱신
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      // 사용자 정보 조회
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 앱 초기화
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        
        // 토큰과 사용자 정보가 모두 있는 경우에만 인증된 상태로 설정
        if (action.payload.accessToken && action.payload.user) {
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          // 토큰이나 사용자 정보가 없으면 비인증 상태로 설정
          state.accessToken = null;
          state.user = null;
          state.isAuthenticated = false;
        }
        
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // OAuth 토큰 설정
      .addCase(setOAuthToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setOAuthToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(setOAuthToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, setAccessToken, clearUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;