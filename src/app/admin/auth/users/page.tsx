'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import EnhancedDetailModal from '@/components/common/EnhancedDetailModal';
import Pagination from '@/components/common/Pagination';
import SearchFilters from '@/components/common/SearchFilters';
import { User } from '@/types';
import {
  PaginatedResponse,
  PaginatedResultBase,
  SearchFilters as SearchFiltersType,
  SortOrderType,
  LimitType,
} from '@/types/api';
import { usePagination } from '@/hooks/usePagination';
import { UserService } from '@/services/userService';
import type { UserSearchQuery, UserSearchResult, UserDetail } from '@krgeobuk/user';
import type { PaginatedResult } from '@krgeobuk/core';

export default function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageInfo, setPageInfo] = useState<PaginatedResultBase>({
    page: 1,
    limit: LimitType.THIRTY,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({});

  const pagination = usePagination();

  // API 호출 함수
  const fetchUsers = useCallback(async (params: UserSearchQuery): Promise<void> => {
    setLoading(true);
    try {
      const response = await UserService.getUsers(params);
      
      setUsers(response.data.items);
      setPageInfo(response.data.pageInfo);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchUsers({
      page: 1,
      limit: LimitType.THIRTY,
      sortBy: 'createdAt',
      sortOrder: SortOrderType.DESC,
    });
  }, [fetchUsers]);

  const handleOpenModal = (user?: UserSearchResult): void => {
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenRoleModal = (user: UserSearchResult): void => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleCloseRoleModal = (): void => {
    setIsRoleModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDetailModal = async (user: UserSearchResult): Promise<void> => {
    try {
      if (user.id) {
        const response = await UserService.getUserById(user.id);
        setUserDetail(response.data);
        setSelectedUser(user);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('사용자 상세 정보 조회 실패:', error);
    }
  };

  const handleCloseDetailModal = (): void => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
    setUserDetail(null);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatStatus = (isEmailVerified: boolean, isIntegrated: boolean): JSX.Element => {
    if (isEmailVerified && isIntegrated) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          통합 완료
        </span>
      );
    } else if (isEmailVerified) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          이메일 인증됨
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          미인증
        </span>
      );
    }
  };

  const getUserRoles = (userId: string): string[] => {
    const userRoleIds = mockUserRoles
      .filter(ur => ur.userId === userId)
      .map(ur => ur.roleId);
    
    return mockRoles
      .filter(role => userRoleIds.includes(role.id))
      .map(role => role.name);
  };

  const formatUserRoleCount = (userId: string): JSX.Element => {
    const roleCount = getUserRoles(userId).length;
    
    return (
      <div className="flex justify-center">
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
          {roleCount}개
        </span>
      </div>
    );
  };

  // 검색 필터 필드 정의
  const searchFields = [
    {
      key: 'email',
      label: '이메일',
      type: 'text' as const,
      placeholder: '이메일을 입력하세요',
    },
    {
      key: 'name',
      label: '이름',
      type: 'text' as const,
      placeholder: '이름을 입력하세요',
    },
    {
      key: 'isEmailVerified',
      label: '이메일 인증',
      type: 'boolean' as const,
    },
    {
      key: 'isIntegrated',
      label: '통합 완료',
      type: 'boolean' as const,
    },
  ];

  const columns = [
    { key: 'email' as keyof UserSearchResult, label: '이메일', sortable: true },
    { key: 'name' as keyof UserSearchResult, label: '이름', sortable: true },
    { key: 'nickname' as keyof UserSearchResult, label: '닉네임', sortable: false },
    {
      key: 'isEmailVerified' as keyof UserSearchResult,
      label: '상태',
      sortable: false,
      render: (value: UserSearchResult[keyof UserSearchResult], row: UserSearchResult) =>
        formatStatus(Boolean(value), Boolean(row.isIntegrated)),
    },
    {
      key: 'id' as keyof UserSearchResult,
      label: 'OAuth',
      sortable: false,
      render: (value: UserSearchResult[keyof UserSearchResult], row: UserSearchResult) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          {row.oauthAccount?.provider || 'Homepage'}
        </span>
      ),
    },
    {
      key: 'id' as keyof UserSearchResult,
      label: '작업',
      sortable: false,
      render: (value: UserSearchResult[keyof UserSearchResult], row: UserSearchResult) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenDetailModal(row)}>
            상세보기
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(row)}>
            수정
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenRoleModal(row)}>
            역할 관리
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">사용자 관리</h1>
                <p className="text-white/80 mt-1">
                  시스템 사용자를 관리하고 역할을 할당합니다. 사용자의 인증 상태와 통합 상태를 확인할 수 있습니다.
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleOpenModal()}
              className="!bg-white !text-blue-700 hover:!bg-blue-50 hover:!text-blue-800 font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 shadow-lg border border-blue-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 사용자 추가
            </Button>
          </div>
        </div>

        <SearchFilters
          fields={searchFields}
          onFiltersChange={useCallback((filters) => {
            setCurrentFilters(filters);
            const newParams = { 
              page: 1, 
              limit: pagination.limit, 
              sortBy: pagination.sortBy, 
              sortOrder: pagination.sortOrder,
              ...filters 
            };
            pagination.goToPage(1);
            fetchUsers(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchUsers])}
          onReset={useCallback(() => {
            setCurrentFilters({});
            const newParams = { 
              page: 1, 
              limit: pagination.limit, 
              sortBy: pagination.sortBy, 
              sortOrder: pagination.sortOrder 
            };
            pagination.goToPage(1);
            fetchUsers(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchUsers])}
        />

        <Table
          data={users}
          columns={columns}
          loading={loading}
          sortBy={pagination.sortBy}
          sortOrder={pagination.sortOrder}
          onSort={(column) => {
            const newSortOrder =
              pagination.sortBy === column && pagination.sortOrder === SortOrderType.DESC
                ? SortOrderType.ASC
                : SortOrderType.DESC;
            const newParams = {
              page: 1,
              limit: pagination.limit,
              sortBy: column,
              sortOrder: newSortOrder,
              ...currentFilters
            };
            pagination.changeSort(column, newSortOrder);
            fetchUsers(newParams);
          }}
        />

        <Pagination
          pageInfo={pageInfo}
          onPageChange={(page) => {
            const newParams = {
              page,
              limit: pagination.limit,
              sortBy: pagination.sortBy,
              sortOrder: pagination.sortOrder,
              ...currentFilters
            };
            pagination.goToPage(page);
            fetchUsers(newParams);
          }}
          onLimitChange={(limit) => {
            const newParams = {
              page: 1,
              limit,
              sortBy: pagination.sortBy,
              sortOrder: pagination.sortOrder,
              ...currentFilters
            };
            pagination.changeLimit(limit);
            fetchUsers(newParams);
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title=""
          size="lg"
        >
          <div className="relative -mx-6 -mt-6">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedUser ? '사용자 수정' : '새 사용자 추가'}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedUser ? '기존 사용자 정보를 수정합니다' : '새로운 사용자를 시스템에 추가합니다'}
                  </p>
                </div>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="px-6 py-6">
              <form className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    기본 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          이메일 <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        defaultValue={selectedUser?.email || ''}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">로그인 시 사용되는 이메일 주소</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          이름 <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedUser?.name || ''}
                        placeholder="홍길동"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">사용자의 실제 이름</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        닉네임
                      </span>
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedUser?.nickname || ''}
                      placeholder="사용자에게 표시될 닉네임"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">사용자에게 표시될 닉네임 (선택사항)</p>
                  </div>
                </div>

                {/* 추가 정보 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    추가 정보
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        프로필 이미지 URL
                      </span>
                    </label>
                    <input
                      type="url"
                      defaultValue={selectedUser?.profileImageUrl || ''}
                      placeholder="https://example.com/profile.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">사용자 프로필 이미지 URL (선택사항)</p>
                  </div>
                </div>

                {/* 상태 설정 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    상태 설정
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={selectedUser?.isEmailVerified || false}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">이메일 인증됨</span>
                        <p className="text-xs text-gray-500 mt-1">사용자의 이메일 주소가 인증된 상태입니다</p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3 p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={selectedUser?.isIntegrated || false}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">통합 완료</span>
                        <p className="text-xs text-gray-500 mt-1">사용자 계정이 시스템에 완전히 통합된 상태입니다</p>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* 액션 버튼 */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCloseModal} className="transition-all hover:scale-105">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  취소
                </Button>
                <Button 
                  onClick={handleCloseModal}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {selectedUser ? '수정 완료' : '사용자 추가'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* 역할 관리 모달 */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={handleCloseRoleModal}
          title=""
          size="lg"
        >
          <div className="relative -mx-6 -mt-6">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">사용자 역할 관리</h3>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedUser?.name}의 역할을 관리합니다
                  </p>
                </div>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* 사용자 정보 섹션 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">사용자 정보</h4>
                      <div className="text-sm text-blue-700 mt-2 space-y-1">
                        <p><strong>이메일:</strong> {selectedUser?.email}</p>
                        <p><strong>이름:</strong> {selectedUser?.name}</p>
                        <p><strong>상태:</strong> 
                          <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                            selectedUser?.isEmailVerified && selectedUser?.isIntegrated ? 'bg-green-100 text-green-800' : 
                            selectedUser?.isEmailVerified ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedUser?.isEmailVerified && selectedUser?.isIntegrated ? '통합 완료' : 
                             selectedUser?.isEmailVerified ? '이메일 인증됨' : '미인증'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 현재 역할 목록 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    현재 할당된 역할
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedUser && getUserRoles(selectedUser.id).length > 0 ? (
                      getUserRoles(selectedUser.id).map((roleName, index) => {
                        const role = mockRoles.find(r => r.name === roleName);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{roleName}</span>
                                <p className="text-xs text-gray-500">우선순위: {role?.priority}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              제거
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">할당된 역할이 없습니다</p>
                        <p className="text-xs text-gray-400 mt-1">사용자에게 역할을 부여해주세요</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 역할 추가 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    역할 추가
                  </h4>
                  <div className="flex space-x-3">
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors">
                      <option value="">추가할 역할을 선택하세요</option>
                      {mockRoles
                        .filter(role => selectedUser ? !getUserRoles(selectedUser.id).includes(role.name) : true)
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} (우선순위: {role.priority})
                          </option>
                        ))}
                    </select>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCloseRoleModal} className="transition-all hover:scale-105">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  닫기
                </Button>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all hover:scale-105"
                  onClick={handleCloseRoleModal}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  설정 완료
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* 사용자 상세 정보 모달 */}
        <EnhancedDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          title="사용자 상세 정보"
          subtitle={userDetail?.email}
          headerIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          headerColor="blue"
          fields={[
            { 
              label: 'ID', 
              value: userDetail?.id,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            },
            { 
              label: '이메일', 
              value: userDetail?.email,
              type: 'badge',
              badgeColor: 'blue',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            },
            { 
              label: '이름', 
              value: userDetail?.name,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            },
            { 
              label: '닉네임', 
              value: userDetail?.nickname || '설정되지 않음',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            },
            { 
              label: '프로필 이미지', 
              value: userDetail?.profileImageUrl || '설정되지 않음',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '이메일 인증 상태', 
              value: userDetail ? (userDetail.isEmailVerified ? '인증됨' : '미인증') : null,
              type: 'badge',
              badgeColor: userDetail?.isEmailVerified ? 'green' : 'red',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            },
            { 
              label: '통합 상태', 
              value: userDetail ? (userDetail.isIntegrated ? '통합됨' : '미통합') : null,
              type: 'badge',
              badgeColor: userDetail?.isIntegrated ? 'green' : 'yellow',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            },
            { 
              label: 'OAuth 제공자', 
              value: userDetail?.oauthAccount?.provider || 'Homepage',
              type: 'badge',
              badgeColor: 'gray',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            },
            { 
              label: '전체 상태', 
              value: userDetail ? formatStatus(userDetail.isEmailVerified, userDetail.isIntegrated) : null,
              type: 'component',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            },
            { 
              label: '생성일', 
              value: selectedUser ? formatDate(selectedUser.createdAt) : null,
              type: 'date',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            },
            { 
              label: '수정일', 
              value: selectedUser ? formatDate(selectedUser.updatedAt) : null,
              type: 'date',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          ]}
          onEdit={() => {
            handleCloseDetailModal();
            handleOpenModal(selectedUser!);
          }}
          onDelete={() => {
            handleCloseDetailModal();
            // 사용자 삭제 로직은 구현되지 않음
            console.log('사용자 삭제:', selectedUser?.id);
          }}
        />
      </div>
    </Layout>
  );
}

