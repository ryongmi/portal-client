'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchOAuthClients,
  fetchOAuthAccounts,
  createOAuthClient,
  updateOAuthClient,
  deleteOAuthClient,
  toggleOAuthClientStatus,
  unlinkOAuthAccount,
  setSelectedClient,
  setSelectedAccount,
  clearError,
} from '@/store/slices/oauthSlice';
import { fetchUsers } from '@/store/slices/userSlice';
import Layout from '@/components/layout/Layout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import LoadingButton from '@/components/common/LoadingButton';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { TableRowSkeleton } from '@/components/common/SkeletonLoader';
import FormField, { Input, Select } from '@/components/common/FormField';
import { ApiErrorMessage } from '@/components/common/ErrorMessage';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { validationRules, mapServerErrorsToFormErrors } from '@/utils/formValidation';
import { toast } from '@/components/common/ToastContainer';
import type { OAuthClient, OAuthAccount } from '@/types';
import { SortOrderType } from '@/types/api';

export default function OAuthManagementPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { clients, accounts, selectedClient, selectedAccount, isLoading, error, pagination } =
    useAppSelector((state) => state.oauth);
  const { users } = useAppSelector((state) => state.user);

  const [activeTab, setActiveTab] = useState<'clients' | 'accounts'>('clients');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState({});
  const [formError, setFormError] = useState<string | null>(null);

  // 로딩 상태 관리
  const { isLoading: isActionsLoading, withLoading } = useLoadingState();

  // 에러 핸들러
  const { handleApiError } = useErrorHandler();

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
  } = useForm<{
    clientName: string;
    redirectUri: string;
    scopes: string;
    status: 'active' | 'inactive';
  }>({
    defaultValues: {
      clientName: '',
      redirectUri: '',
      scopes: '',
      status: 'active',
    },
    mode: 'onChange',
  });

  // 초기 데이터 로드
  useEffect(() => {
    dispatch(fetchOAuthClients({}));
    dispatch(fetchOAuthAccounts({}));
    dispatch(fetchUsers({}));
  }, [dispatch]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      console.error('Error:', error);
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  const handleSearch = (query: Record<string, unknown>) => {
    setSearchQuery(query);
    if (activeTab === 'clients') {
      dispatch(fetchOAuthClients(query));
    } else {
      dispatch(fetchOAuthAccounts(query));
    }
  };

  const handlePageChange = (page: number) => {
    const query = { ...searchQuery, page };
    if (activeTab === 'clients') {
      dispatch(fetchOAuthClients(query));
    } else {
      dispatch(fetchOAuthAccounts(query));
    }
  };

  const handleOpenClientModal = (client?: OAuthClient) => {
    if (client) {
      dispatch(setSelectedClient(client));
      reset({
        clientName: client.clientName || '',
        redirectUri: client.redirectUri || '',
        scopes: client.scopes?.join(', ') || '',
        status: client.status || 'active',
      });
    } else {
      dispatch(setSelectedClient(null));
      reset({
        clientName: '',
        redirectUri: '',
        scopes: '',
        status: 'active',
      });
    }
    setFormError(null);
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    dispatch(setSelectedClient(null));
    setFormError(null);
    reset();
  };

  const handleOpenAccountModal = (account?: OAuthAccount) => {
    if (account) {
      dispatch(setSelectedAccount(account));
    }
    setIsAccountModalOpen(true);
  };

  const handleCloseAccountModal = () => {
    setIsAccountModalOpen(false);
    dispatch(setSelectedAccount(null));
  };

  const onSubmit = withLoading(
    'submit',
    async (data: {
      clientName: string;
      redirectUri: string;
      scopes: string;
      status: 'active' | 'inactive';
    }) => {
      try {
        setFormError(null);

        const clientData = {
          clientName: data.clientName,
          redirectUri: data.redirectUri,
          scopes: data.scopes.split(',').map((scope) => scope.trim()),
          status: data.status,
        };

        if (selectedClient) {
          await dispatch(
            updateOAuthClient({
              clientId: selectedClient.id,
              clientData,
            })
          ).unwrap();

          toast.success(
            'OAuth 클라이언트 수정 완료',
            'OAuth 클라이언트가 성공적으로 수정되었습니다.'
          );
        } else {
          await dispatch(createOAuthClient(clientData)).unwrap();

          toast.success(
            'OAuth 클라이언트 생성 완료',
            '새 OAuth 클라이언트가 성공적으로 생성되었습니다.'
          );
        }

        handleCloseClientModal();
        dispatch(fetchOAuthClients(searchQuery));
      } catch (error: unknown) {
        // 서버 에러를 폼 에러로 매핑
        const formErrors = mapServerErrorsToFormErrors(
          (error as any)?.response?.data?.errors
        );

        // 각 필드별 에러 설정
        Object.keys(formErrors).forEach((field) => {
          if (
            field === 'clientName' ||
            field === 'redirectUri' ||
            field === 'scopes' ||
            field === 'status'
          ) {
            const errorMessage = formErrors[field];
            if (errorMessage) {
              const message =
                typeof errorMessage === 'string'
                  ? errorMessage
                  : errorMessage.message || 'Invalid input';
              setError(field as keyof typeof data, { type: 'manual', message });
            }
          }
        });

        // 일반적인 에러 메시지 설정
        const errorMessage = handleApiError(error, { showToast: false });
        setFormError(errorMessage);
      }
    }
  );

  const handleDeleteClient = withLoading('delete', async (clientId: string) => {
    if (window.confirm('정말로 이 OAuth 클라이언트를 삭제하시겠습니까?')) {
      try {
        await dispatch(deleteOAuthClient(clientId)).unwrap();
        toast.success(
          'OAuth 클라이언트 삭제 완료',
          'OAuth 클라이언트가 성공적으로 삭제되었습니다.'
        );
        dispatch(fetchOAuthClients(searchQuery));
      } catch (error) {
        handleApiError(error);
      }
    }
  });

  const handleToggleClientStatus = withLoading(
    'toggleStatus',
    async (clientId: string, currentStatus: 'active' | 'inactive') => {
      try {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await dispatch(toggleOAuthClientStatus({ clientId, status: newStatus })).unwrap();
        toast.success(
          '상태 변경 완료',
          `OAuth 클라이언트가 ${newStatus === 'active' ? '활성화' : '비활성화'}되었습니다.`
        );
        dispatch(fetchOAuthClients(searchQuery));
      } catch (error) {
        handleApiError(error);
      }
    }
  );

  const handleUnlinkAccount = withLoading('unlink', async (accountId: string) => {
    if (window.confirm('정말로 이 OAuth 계정 연결을 해제하시겠습니까?')) {
      try {
        await dispatch(unlinkOAuthAccount(accountId)).unwrap();
        toast.success('계정 연결 해제 완료', 'OAuth 계정 연결이 성공적으로 해제되었습니다.');
        dispatch(fetchOAuthAccounts(searchQuery));
      } catch (error) {
        handleApiError(error);
      }
    }
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatStatus = (status: 'active' | 'inactive'): JSX.Element => {
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {status === 'active' ? '활성' : '비활성'}
      </span>
    );
  };

  const formatProvider = (provider: string): JSX.Element => {
    const providerColors = {
      google: 'bg-red-100 text-red-800',
      naver: 'bg-green-100 text-green-800',
      kakao: 'bg-yellow-100 text-yellow-800',
      github: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          providerColors[provider as keyof typeof providerColors] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {provider.toUpperCase()}
      </span>
    );
  };

  const getUserEmail = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return user?.email || '알 수 없음';
  };

  const clientColumns = [
    {
      key: 'clientName' as keyof OAuthClient,
      label: '클라이언트 이름',
      sortable: true,
      render: (value: OAuthClient[keyof OAuthClient]) => <span>{String(value || 'N/A')}</span>,
    },
    {
      key: 'clientId' as keyof OAuthClient,
      label: '클라이언트 ID',
      sortable: true,
      render: (value: OAuthClient[keyof OAuthClient]) => <span>{String(value || 'N/A')}</span>,
    },
    {
      key: 'redirectUri' as keyof OAuthClient,
      label: '리다이렉트 URI',
      sortable: false,
      render: (value: OAuthClient[keyof OAuthClient]) => (
        <span className="text-blue-500 hover:underline cursor-pointer" title={String(value)}>
          {String(value).length > 30 ? `${String(value).substring(0, 30)}...` : String(value)}
        </span>
      ),
    },
    {
      key: 'status' as keyof OAuthClient,
      label: '상태',
      sortable: true,
      render: (value: OAuthClient[keyof OAuthClient]) =>
        formatStatus(value as 'active' | 'inactive'),
    },
    {
      key: 'createdAt' as keyof OAuthClient,
      label: '생성일',
      sortable: true,
      render: (value: OAuthClient[keyof OAuthClient]) => <span>{formatDate(String(value))}</span>,
    },
    {
      key: 'id' as keyof OAuthClient,
      label: '작업',
      sortable: false,
      render: (value: OAuthClient[keyof OAuthClient], row: OAuthClient) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenClientModal(row)}>
            수정
          </Button>
          <LoadingButton
            size="sm"
            variant="outline"
            onClick={() => handleToggleClientStatus(row.id, row.status)}
            isLoading={isActionsLoading('toggleStatus')}
            loadingText={row.status === 'active' ? '비활성화 중' : '활성화 중'}
          >
            {row.status === 'active' ? '비활성화' : '활성화'}
          </LoadingButton>
          <LoadingButton
            size="sm"
            variant="outline"
            onClick={() => handleDeleteClient(row.id)}
            isLoading={isActionsLoading('delete')}
            loadingText="삭제 중"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            삭제
          </LoadingButton>
        </div>
      ),
    },
  ];

  const accountColumns = [
    {
      key: 'providerId' as keyof OAuthAccount,
      label: 'Provider ID',
      sortable: true,
      render: (value: OAuthAccount[keyof OAuthAccount]) => <span>{String(value || 'N/A')}</span>,
    },
    {
      key: 'provider' as keyof OAuthAccount,
      label: 'Provider',
      sortable: true,
      render: (value: OAuthAccount[keyof OAuthAccount]) => formatProvider(String(value)),
    },
    {
      key: 'userId' as keyof OAuthAccount,
      label: '사용자 이메일',
      sortable: false,
      render: (value: OAuthAccount[keyof OAuthAccount]) => (
        <span>{getUserEmail(String(value))}</span>
      ),
    },
    {
      key: 'createdAt' as keyof OAuthAccount,
      label: '연결일',
      sortable: true,
      render: (value: OAuthAccount[keyof OAuthAccount]) => <span>{formatDate(String(value))}</span>,
    },
    {
      key: 'id' as keyof OAuthAccount,
      label: '작업',
      sortable: false,
      render: (value: OAuthAccount[keyof OAuthAccount], row: OAuthAccount) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenAccountModal(row)}>
            상세보기
          </Button>
          <LoadingButton
            size="sm"
            variant="outline"
            onClick={() => handleUnlinkAccount(row.id)}
            isLoading={isActionsLoading('unlink')}
            loadingText="해제 중"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            연결 해제
          </LoadingButton>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">OAuth 관리 (Redux)</h1>
                  <p className="text-white/80 mt-1">
                    OAuth 클라이언트와 계정을 관리합니다. Redux를 사용한 상태 관리 시스템입니다.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => handleOpenClientModal()}
                className="!bg-white !text-emerald-700 hover:!bg-emerald-50"
              >
                새 OAuth 클라이언트 추가
              </Button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 탭 */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'clients'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  OAuth 클라이언트
                </button>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'accounts'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  OAuth 계정
                </button>
              </nav>
            </div>

            {/* 검색 */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeTab === 'clients' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        클라이언트 이름
                      </label>
                      <input
                        type="text"
                        placeholder="클라이언트 이름을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) =>
                          handleSearch({ ...searchQuery, clientName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => handleSearch({ ...searchQuery, status: e.target.value })}
                      >
                        <option value="">전체</option>
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => handleSearch({ ...searchQuery, provider: e.target.value })}
                      >
                        <option value="">전체</option>
                        <option value="google">Google</option>
                        <option value="naver">Naver</option>
                        <option value="kakao">Kakao</option>
                        <option value="github">GitHub</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        사용자 이메일
                      </label>
                      <input
                        type="email"
                        placeholder="사용자 이메일을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) =>
                          handleSearch({ ...searchQuery, userEmail: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end">
                  <Button onClick={() => handleSearch({})}>검색 초기화</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          {activeTab === 'clients' ? (
            <Table
              data={clients}
              columns={clientColumns}
              loading={isLoading}
              sortBy="createdAt"
              sortOrder={SortOrderType.DESC}
              onSort={(column) => {
                // Sort functionality placeholder
              }}
            />
          ) : (
            <Table
              data={accounts}
              columns={accountColumns}
              loading={isLoading}
              sortBy="createdAt"
              sortOrder={SortOrderType.DESC}
              onSort={(column) => {
                // Sort functionality placeholder
              }}
            />
          )}

          {/* 페이지네이션 */}
          <Pagination
            pageInfo={pagination}
            onPageChange={handlePageChange}
            onLimitChange={(limit) => {
              handleSearch({ ...searchQuery, limit });
            }}
          />

          {/* OAuth 클라이언트 모달 */}
          <Modal
            isOpen={isClientModalOpen}
            onClose={handleCloseClientModal}
            title={selectedClient ? 'OAuth 클라이언트 수정' : '새 OAuth 클라이언트 추가'}
            size="lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 일반적인 에러 메시지 */}
              {formError && (
                <ApiErrorMessage
                  error={{ message: formError }}
                  onDismiss={() => setFormError(null)}
                />
              )}

              <FormField
                label="클라이언트 이름"
                required
                {...(errors.clientName?.message && { error: errors.clientName.message })}
                className="pb-4"
              >
                <Input
                  type="text"
                  {...register('clientName', {
                    required: '클라이언트 이름을 입력해주세요',
                    minLength: {
                      value: 2,
                      message: '클라이언트 이름은 최소 2자 이상이어야 합니다',
                    },
                    maxLength: {
                      value: 100,
                      message: '클라이언트 이름은 최대 100자까지 입력 가능합니다',
                    },
                  })}
                  {...(errors.clientName?.message && { error: errors.clientName.message })}
                  placeholder="OAuth 클라이언트 이름을 입력하세요"
                />
              </FormField>

              <FormField
                label="리다이렉트 URI"
                required
                {...(errors.redirectUri?.message && { error: errors.redirectUri.message })}
                hint="OAuth 인증 후 리다이렉트될 URL을 입력하세요"
                className="pb-4"
              >
                <Input
                  type="url"
                  {...register('redirectUri', {
                    required: '리다이렉트 URI를 입력해주세요',
                    pattern: {
                      value:
                        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                      message: '올바른 URL 형식을 입력해주세요 (예: https://example.com/callback)',
                    },
                  })}
                  {...(errors.redirectUri?.message && { error: errors.redirectUri.message })}
                  placeholder="https://example.com/oauth/callback"
                />
              </FormField>

              <FormField
                label="스코프"
                {...(errors.scopes?.message && { error: errors.scopes.message })}
                hint="OAuth 스코프를 쉼표로 구분하여 입력하세요 (예: read, write, admin)"
                className="pb-4"
              >
                <Input
                  type="text"
                  {...register('scopes', {
                    maxLength: {
                      value: 500,
                      message: '스코프는 최대 500자까지 입력 가능합니다',
                    },
                  })}
                  {...(errors.scopes?.message && { error: errors.scopes.message })}
                  placeholder="read, write, admin"
                />
              </FormField>

              <FormField
                label="상태"
                required
                {...(errors.status?.message && { error: errors.status.message })}
                className="pb-4"
              >
                <Select
                  {...register('status')}
                  {...(errors.status?.message && { error: errors.status.message })}
                  options={[
                    { value: 'active', label: '활성' },
                    { value: 'inactive', label: '비활성' },
                  ]}
                />
              </FormField>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseClientModal}>
                  취소
                </Button>
                <LoadingButton
                  type="submit"
                  isLoading={isActionsLoading('submit')}
                  loadingText="처리 중..."
                  disabled={isSubmitting}
                >
                  {selectedClient ? '수정' : '추가'}
                </LoadingButton>
              </div>
            </form>
          </Modal>

          {/* OAuth 계정 상세보기 모달 */}
          <Modal
            isOpen={isAccountModalOpen}
            onClose={handleCloseAccountModal}
            title="OAuth 계정 상세보기"
            size="lg"
          >
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">계정 정보</h4>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Provider:</span> {selectedAccount?.provider}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Provider ID:</span> {selectedAccount?.providerId}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">사용자 이메일:</span>{' '}
                    {selectedAccount ? getUserEmail(selectedAccount.userId) : ''}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">연결일:</span>{' '}
                    {selectedAccount ? formatDate(selectedAccount.createdAt) : ''}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={handleCloseAccountModal}>
                  닫기
                </Button>
                <LoadingButton
                  onClick={() => {
                    if (selectedAccount) {
                      handleUnlinkAccount(selectedAccount.id);
                      handleCloseAccountModal();
                    }
                  }}
                  isLoading={isActionsLoading('unlink')}
                  loadingText="해제 중"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  연결 해제
                </LoadingButton>
              </div>
            </div>
          </Modal>
        </div>
      </Layout>
    </AuthGuard>
  );
}

