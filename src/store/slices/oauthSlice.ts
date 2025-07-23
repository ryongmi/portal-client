import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/lib/axios';
import type { OAuthClient, OAuthAccount } from '@/types';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { PaginatedResultBase } from '@krgeobuk/core/interfaces';

interface OAuthState {
  clients: OAuthClient[];
  accounts: OAuthAccount[];
  selectedClient: OAuthClient | null;
  selectedAccount: OAuthAccount | null;
  isLoading: boolean;
  error: string | null;
  pagination: PaginatedResultBase;
}

const initialState: OAuthState = {
  clients: [],
  accounts: [],
  selectedClient: null,
  selectedAccount: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 30,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  },
};

// OAuth 클라이언트 목록 조회 비동기 액션
export const fetchOAuthClients = createAsyncThunk(
  'oauth/fetchOAuthClients',
  async (query: Record<string, unknown> = {}, { rejectWithValue }) => {
    try {
      const response = await authApi.get<ApiResponse<PaginatedResponse<OAuthClient>>>(
        '/oauth/clients',
        {
          params: query,
        }
      );
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 클라이언트 목록을 불러올 수 없습니다.'
      );
    }
  }
);

// 특정 OAuth 클라이언트 조회 비동기 액션
export const fetchOAuthClientById = createAsyncThunk(
  'oauth/fetchOAuthClientById',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const response = await authApi.get<ApiResponse<OAuthClient>>(`/oauth/clients/${clientId}`);
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 클라이언트 정보를 불러올 수 없습니다.'
      );
    }
  }
);

// OAuth 클라이언트 생성 비동기 액션
export const createOAuthClient = createAsyncThunk(
  'oauth/createOAuthClient',
  async (
    clientData: Omit<OAuthClient, 'id' | 'createdAt'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.post<ApiResponse<OAuthClient>>('/oauth/clients', clientData);
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 클라이언트 생성에 실패했습니다.'
      );
    }
  }
);

// OAuth 클라이언트 수정 비동기 액션
export const updateOAuthClient = createAsyncThunk(
  'oauth/updateOAuthClient',
  async (
    {
      clientId,
      clientData,
    }: {
      clientId: string;
      clientData: Partial<OAuthClient>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.patch<ApiResponse<OAuthClient>>(
        `/oauth/clients/${clientId}`,
        clientData
      );
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 클라이언트 수정에 실패했습니다.'
      );
    }
  }
);

// OAuth 클라이언트 삭제 비동기 액션
export const deleteOAuthClient = createAsyncThunk(
  'oauth/deleteOAuthClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      await authApi.delete<ApiResponse<void>>(`/oauth/clients/${clientId}`);
      return clientId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 클라이언트 삭제에 실패했습니다.'
      );
    }
  }
);

// OAuth 클라이언트 상태 변경 비동기 액션
export const toggleOAuthClientStatus = createAsyncThunk(
  'oauth/toggleOAuthClientStatus',
  async (
    {
      clientId,
      status,
    }: {
      clientId: string;
      status: 'active' | 'inactive';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.patch<ApiResponse<OAuthClient>>(
        `/oauth/clients/${clientId}/status`,
        { status }
      );
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 클라이언트 상태 변경에 실패했습니다.'
      );
    }
  }
);

// OAuth 계정 목록 조회 비동기 액션
export const fetchOAuthAccounts = createAsyncThunk(
  'oauth/fetchOAuthAccounts',
  async (query: Record<string, unknown> = {}, { rejectWithValue }) => {
    try {
      const response = await authApi.get<ApiResponse<PaginatedResponse<OAuthAccount>>>(
        '/oauth/accounts',
        {
          params: query,
        }
      );
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 계정 목록을 불러올 수 없습니다.'
      );
    }
  }
);

// 특정 사용자의 OAuth 계정 조회 비동기 액션
export const fetchOAuthAccountsByUserId = createAsyncThunk(
  'oauth/fetchOAuthAccountsByUserId',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await authApi.get<ApiResponse<OAuthAccount[]>>(
        `/oauth/accounts/user/${userId}`
      );
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || '사용자 OAuth 계정 목록을 불러올 수 없습니다.'
      );
    }
  }
);

// OAuth 계정 연결 해제 비동기 액션
export const unlinkOAuthAccount = createAsyncThunk(
  'oauth/unlinkOAuthAccount',
  async (accountId: string, { rejectWithValue }) => {
    try {
      await authApi.delete<ApiResponse<void>>(`/oauth/accounts/${accountId}`);
      return accountId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'OAuth 계정 연결 해제에 실패했습니다.'
      );
    }
  }
);

const oauthSlice = createSlice({
  name: 'oauth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedClient: (state, action: PayloadAction<OAuthClient | null>) => {
      state.selectedClient = action.payload;
    },
    setSelectedAccount: (state, action: PayloadAction<OAuthAccount | null>) => {
      state.selectedAccount = action.payload;
    },
    clearClients: (state) => {
      state.clients = [];
      state.pagination = initialState.pagination;
    },
    clearAccounts: (state) => {
      state.accounts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // OAuth 클라이언트 목록 조회
      .addCase(fetchOAuthClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOAuthClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload.items;
        state.pagination = action.payload.pageInfo;
        state.error = null;
      })
      .addCase(fetchOAuthClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 특정 OAuth 클라이언트 조회
      .addCase(fetchOAuthClientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOAuthClientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedClient = action.payload;
        state.error = null;
      })
      .addCase(fetchOAuthClientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // OAuth 클라이언트 생성
      .addCase(createOAuthClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOAuthClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients.push(action.payload);
        state.error = null;
      })
      .addCase(createOAuthClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // OAuth 클라이언트 수정
      .addCase(updateOAuthClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOAuthClient.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex((client) => client.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
        state.error = null;
      })
      .addCase(updateOAuthClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // OAuth 클라이언트 삭제
      .addCase(deleteOAuthClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteOAuthClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = state.clients.filter((client) => client.id !== action.payload);
        if (state.selectedClient?.id === action.payload) {
          state.selectedClient = null;
        }
        state.error = null;
      })
      .addCase(deleteOAuthClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // OAuth 클라이언트 상태 변경
      .addCase(toggleOAuthClientStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleOAuthClientStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex((client) => client.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.selectedClient?.id === action.payload.id) {
          state.selectedClient = action.payload;
        }
        state.error = null;
      })
      .addCase(toggleOAuthClientStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // OAuth 계정 목록 조회
      .addCase(fetchOAuthAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOAuthAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload.items;
        state.pagination = action.payload.pageInfo;
        state.error = null;
      })
      .addCase(fetchOAuthAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 특정 사용자의 OAuth 계정 조회
      .addCase(fetchOAuthAccountsByUserId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOAuthAccountsByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        state.error = null;
      })
      .addCase(fetchOAuthAccountsByUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // OAuth 계정 연결 해제
      .addCase(unlinkOAuthAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unlinkOAuthAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = state.accounts.filter((account) => account.id !== action.payload);
        if (state.selectedAccount?.id === action.payload) {
          state.selectedAccount = null;
        }
        state.error = null;
      })
      .addCase(unlinkOAuthAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedClient,
  setSelectedAccount,
  clearClients,
  clearAccounts,
} = oauthSlice.actions;
export default oauthSlice.reducer;