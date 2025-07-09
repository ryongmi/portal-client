'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/layout/Layout'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Pagination from '@/components/common/Pagination'
import SearchFilters from '@/components/common/SearchFilters'
import { OAuthAccount } from '@/types'
import { PaginatedResultBase, SearchFilters as SearchFiltersType, SortOrderType, LimitType } from '@/types/api'
import { usePagination } from '@/hooks/usePagination'
import { mockOAuthAccounts, mockUsers } from '@/data/mockData'

export default function OAuthAccountsPage(): JSX.Element {
  const [oauthAccounts, setOauthAccounts] = useState<OAuthAccount[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [pageInfo, setPageInfo] = useState<PaginatedResultBase>({
    page: 1,
    limit: LimitType.THIRTY,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedAccount, setSelectedAccount] = useState<OAuthAccount | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({})

  const pagination = usePagination()

  // Mock API 호출 함수
  const fetchOAuthAccounts = useCallback(async (params: any): Promise<void> => {
    setLoading(true)
    try {
      // 최소 로딩 시간 보장 (UX 개선)
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 200))
      
      // 필터링 로직
      let filteredAccounts = [...mockOAuthAccounts]
      
      if (params.providerId) {
        filteredAccounts = filteredAccounts.filter(account => 
          account.providerId.toLowerCase().includes(params.providerId.toLowerCase())
        )
      }
      
      if (params.provider) {
        filteredAccounts = filteredAccounts.filter(account => 
          account.provider === params.provider
        )
      }
      
      if (params.userEmail) {
        const userIds = mockUsers
          .filter(user => user.email.toLowerCase().includes(params.userEmail.toLowerCase()))
          .map(user => user.id)
        filteredAccounts = filteredAccounts.filter(account => 
          userIds.includes(account.userId)
        )
      }
      
      // 정렬 로직
      if (params.sortBy) {
        filteredAccounts.sort((a, b) => {
          const aValue = a[params.sortBy as keyof OAuthAccount]
          const bValue = b[params.sortBy as keyof OAuthAccount]
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return params.sortOrder === SortOrderType.ASC 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }
          
          return params.sortOrder === SortOrderType.ASC 
            ? (aValue as any) - (bValue as any)
            : (bValue as any) - (aValue as any)
        })
      }
      
      // 페이징 로직
      const totalItems = filteredAccounts.length
      const totalPages = Math.ceil(totalItems / params.limit)
      const startIndex = (params.page - 1) * params.limit
      const endIndex = startIndex + params.limit
      const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex)
      
      setOauthAccounts(paginatedAccounts)
      setPageInfo({
        page: params.page,
        limit: params.limit,
        totalItems,
        totalPages,
        hasPreviousPage: params.page > 1,
        hasNextPage: params.page < totalPages,
      })
      
      // 최소 로딩 시간 대기
      await minLoadingTime
    } catch (error) {
      console.error('Failed to fetch oauth accounts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    fetchOAuthAccounts({
      page: 1,
      limit: LimitType.THIRTY,
      sortBy: 'createdAt',
      sortOrder: SortOrderType.DESC,
    })
  }, [])

  const handleOpenModal = (account?: OAuthAccount): void => {
    setSelectedAccount(account || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = (): void => {
    setIsModalOpen(false)
    setSelectedAccount(null)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatProvider = (provider: string): JSX.Element => {
    const providerColors = {
      google: 'bg-red-100 text-red-800',
      naver: 'bg-green-100 text-green-800',
      kakao: 'bg-yellow-100 text-yellow-800',
      github: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${providerColors[provider as keyof typeof providerColors] || 'bg-gray-100 text-gray-800'}`}>
        {provider.toUpperCase()}
      </span>
    )
  }

  const getUserEmail = (userId: string): string => {
    const user = mockUsers.find(u => u.id === userId)
    return user?.email || '알 수 없음'
  }

  // 검색 필터 필드 정의
  const searchFields = [
    {
      key: 'providerId',
      label: 'Provider ID',
      type: 'text' as const,
      placeholder: 'Provider ID를 입력하세요'
    },
    {
      key: 'provider',
      label: 'Provider',
      type: 'select' as const,
      options: [
        { value: 'google', label: 'Google' },
        { value: 'naver', label: 'Naver' },
        { value: 'kakao', label: 'Kakao' },
        { value: 'github', label: 'GitHub' }
      ]
    },
    {
      key: 'userEmail',
      label: '사용자 이메일',
      type: 'text' as const,
      placeholder: '사용자 이메일을 입력하세요'
    }
  ]

  const columns = [
    { key: 'providerId' as keyof OAuthAccount, label: 'Provider ID', sortable: true },
    { 
      key: 'provider' as keyof OAuthAccount, 
      label: 'Provider', 
      sortable: true,
      render: (value: OAuthAccount[keyof OAuthAccount]) => formatProvider(String(value))
    },
    { 
      key: 'userId' as keyof OAuthAccount, 
      label: '사용자 이메일',
      sortable: false,
      render: (value: OAuthAccount[keyof OAuthAccount]) => getUserEmail(String(value))
    },
    { 
      key: 'createdAt' as keyof OAuthAccount, 
      label: '연결일',
      sortable: true,
      render: (value: OAuthAccount[keyof OAuthAccount]) => formatDate(String(value))
    },
    {
      key: 'id' as keyof OAuthAccount,
      label: '작업',
      sortable: false,
      render: (value: OAuthAccount[keyof OAuthAccount], row: OAuthAccount) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(row)}>
            수정
          </Button>
          <Button size="sm" variant="danger">
            연결 해제
          </Button>
        </div>
      )
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">OAuth 계정 관리</h1>
                <p className="text-white/80 mt-1">
                  외부 OAuth 제공자와 연결된 계정을 관리합니다. Google, Naver, Kakao 등의 소셜 로그인을 지원합니다.
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleOpenModal()}
              className="!bg-white !text-emerald-700 hover:!bg-emerald-50 hover:!text-emerald-800 font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 shadow-lg border border-emerald-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 OAuth 계정 추가
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
            fetchOAuthAccounts(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchOAuthAccounts])}
          onReset={useCallback(() => {
            setCurrentFilters({});
            const newParams = { 
              page: 1, 
              limit: pagination.limit, 
              sortBy: pagination.sortBy, 
              sortOrder: pagination.sortOrder 
            };
            pagination.goToPage(1);
            fetchOAuthAccounts(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchOAuthAccounts])}
        />

        <Table 
          data={oauthAccounts} 
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
            fetchOAuthAccounts(newParams);
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
            fetchOAuthAccounts(newParams);
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
            fetchOAuthAccounts(newParams);
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedAccount ? 'OAuth 계정 수정' : '새 OAuth 계정 추가'}
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider ID
              </label>
              <input
                type="text"
                defaultValue={selectedAccount?.providerId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                defaultValue={selectedAccount?.provider || 'google'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="google">Google</option>
                <option value="naver">Naver</option>
                <option value="kakao">Kakao</option>
                <option value="github">GitHub</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사용자
              </label>
              <select
                defaultValue={selectedAccount?.userId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">사용자 선택</option>
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                취소
              </Button>
              <Button onClick={handleCloseModal}>
                {selectedAccount ? '수정' : '추가'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  )
}