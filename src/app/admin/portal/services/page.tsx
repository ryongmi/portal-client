'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/layout/Layout'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import EnhancedDetailModal from '@/components/common/EnhancedDetailModal'
import Pagination from '@/components/common/Pagination'
import SearchFilters from '@/components/common/SearchFilters'
import { Service } from '@/types'
import { PaginatedResultBase, SearchFilters as SearchFiltersType, SortOrderType, LimitType } from '@/types/api'
import { usePagination } from '@/hooks/usePagination'
import { mockServices, mockRoles, mockServiceVisibleRoles } from '@/data/mockData'

export default function ServicesPage(): JSX.Element {
  const [services, setServices] = useState<Service[]>([])
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
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState<boolean>(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({})

  const pagination = usePagination()

  // Mock API 호출 함수
  const fetchServices = useCallback(async (params: any): Promise<void> => {
    setLoading(true)
    try {
      // 최소 로딩 시간 보장 (UX 개선)
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 200))
      
      // 필터링 로직
      let filteredServices = [...mockServices]
      
      if (params.name) {
        filteredServices = filteredServices.filter(service => 
          service.name.toLowerCase().includes(params.name.toLowerCase())
        )
      }
      
      if (params.displayName) {
        filteredServices = filteredServices.filter(service => 
          service.displayName?.toLowerCase().includes(params.displayName.toLowerCase())
        )
      }
      
      if (params.isVisible !== undefined) {
        filteredServices = filteredServices.filter(service => 
          service.isVisible === params.isVisible
        )
      }
      
      if (params.isVisibleByRole !== undefined) {
        filteredServices = filteredServices.filter(service => 
          service.isVisibleByRole === params.isVisibleByRole
        )
      }
      
      // 정렬 로직
      if (params.sortBy) {
        filteredServices.sort((a, b) => {
          const aValue = a[params.sortBy as keyof Service]
          const bValue = b[params.sortBy as keyof Service]
          
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
      const totalItems = filteredServices.length
      const totalPages = Math.ceil(totalItems / params.limit)
      const startIndex = (params.page - 1) * params.limit
      const endIndex = startIndex + params.limit
      const paginatedServices = filteredServices.slice(startIndex, endIndex)
      
      setServices(paginatedServices)
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
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    fetchServices({
      page: 1,
      limit: LimitType.THIRTY,
      sortBy: 'displayName',
      sortOrder: SortOrderType.ASC,
    })
  }, [])

  const handleOpenModal = (service?: Service): void => {
    setSelectedService(service || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = (): void => {
    setIsModalOpen(false)
    setSelectedService(null)
  }

  const handleOpenVisibilityModal = (service: Service): void => {
    setSelectedService(service)
    setIsVisibilityModalOpen(true)
  }

  const handleCloseVisibilityModal = (): void => {
    setIsVisibilityModalOpen(false)
    setSelectedService(null)
  }

  const handleOpenDetailModal = (service: Service): void => {
    setSelectedService(service)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = (): void => {
    setIsDetailModalOpen(false)
    setSelectedService(null)
  }

  const handleDeleteService = (service: Service): void => {
    setServiceToDelete(service)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteService = (): void => {
    if (serviceToDelete) {
      console.log('Deleting service:', serviceToDelete.id)
      // 실제로는 API 호출
      setDeleteConfirmOpen(false)
      setServiceToDelete(null)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatVisibility = (isVisible?: boolean, isVisibleByRole?: boolean): JSX.Element => {
    // 조건 1: 포탈에서 표시 = false → 비공개
    if (!isVisible) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          비공개
        </span>
      )
    } 
    // 조건 2: 포탈에서 표시 = true + 권한 기반 표시 = true → 권한 기반
    else if (isVisible && isVisibleByRole) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          권한 기반
        </span>
      )
    } 
    // 조건 3: 포탈에서 표시 = true + 권한 기반 표시 = false → 공개
    else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          공개
        </span>
      )
    }
  }

  const getServiceVisibleRoles = (serviceId: string): string[] => {
    const roleIds = mockServiceVisibleRoles
      .filter(svr => svr.serviceId === serviceId)
      .map(svr => svr.roleId);
    
    return mockRoles
      .filter(role => roleIds.includes(role.id))
      .map(role => role.name);
  }

  const formatServiceVisibleRoles = (serviceId: string): JSX.Element => {
    const service = mockServices.find(s => s.id === serviceId);
    const roles = getServiceVisibleRoles(serviceId);
    
    // 비공개 서비스는 포탈에서 아무도 볼 수 없음
    if (!service?.isVisible) {
      return <span className="text-gray-500 text-sm">포탈에서 비공개</span>;
    }
    
    // 공개 서비스 (권한 기반이 아닌 경우)
    if (!service?.isVisibleByRole) {
      return <span className="text-green-600 text-sm">모든 사용자</span>;
    }
    
    // 권한 기반 서비스
    if (roles.length === 0) {
      return <span className="text-orange-600 text-sm">역할 미설정</span>;
    }
    
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        {roles.length}개 역할
      </span>
    );
  }

  // 검색 필터 필드 정의
  const searchFields = [
    {
      key: 'name',
      label: '서비스명 (내부용)',
      type: 'text' as const,
      placeholder: '서비스명을 입력하세요 (예: auth-service)'
    },
    {
      key: 'displayName',
      label: '표시명',
      type: 'text' as const,
      placeholder: '표시명을 입력하세요 (예: 인증 서비스)'
    },
    {
      key: 'isVisible',
      label: '포탈 표시',
      type: 'boolean' as const
    },
    {
      key: 'isVisibleByRole',
      label: '권한 기반 표시',
      type: 'boolean' as const
    }
  ]

  const columns = [
    { 
      key: 'displayName' as keyof Service, 
      label: '서비스명',
      sortable: true,
      render: (value: Service[keyof Service], row: Service) => (
        <div className="flex items-center space-x-3">
          {row.iconUrl && (
            <img 
              src={row.iconUrl} 
              alt={String(value) || row.name}
              className="w-8 h-8 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{String(value) || row.name}</span>
            <span className="text-sm text-gray-500">{row.name}</span>
          </div>
        </div>
      )
    },
    { key: 'description' as keyof Service, label: '설명', sortable: false },
    { key: 'baseUrl' as keyof Service, label: 'URL', sortable: false },
    { 
      key: 'isVisible' as keyof Service, 
      label: '가시성', 
      sortable: false,
      render: (value: Service[keyof Service], row: Service) => formatVisibility(Boolean(value), Boolean(row.isVisibleByRole))
    },
    {
      key: 'id' as keyof Service,
      label: '접근 권한',
      sortable: false,
      render: (value: Service[keyof Service], row: Service) => formatServiceVisibleRoles(row.id),
    },
    {
      key: 'id' as keyof Service,
      label: '작업',
      sortable: false,
      render: (value: Service[keyof Service], row: Service) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenDetailModal(row)}>
            상세보기
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(row)}>
            수정
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenVisibilityModal(row)}>
            가시성 설정
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteService(row)}>
            삭제
          </Button>
        </div>
      )
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">서비스 관리</h1>
                <p className="text-white/80 mt-1">
                  KRGeobuk 생태계의 서비스를 관리합니다. 서비스 등록, 가시성 설정, 역할 기반 접근 제어를 설정할 수 있습니다.
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleOpenModal()}
              className="!bg-white !text-violet-700 hover:!bg-violet-50 hover:!text-violet-800 font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 shadow-lg border border-violet-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 서비스 추가
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
            fetchServices(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchServices])}
          onReset={useCallback(() => {
            setCurrentFilters({});
            const newParams = { 
              page: 1, 
              limit: pagination.limit, 
              sortBy: pagination.sortBy, 
              sortOrder: pagination.sortOrder 
            };
            pagination.goToPage(1);
            fetchServices(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchServices])}
        />

        <Table 
          data={services} 
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
            fetchServices(newParams);
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
            fetchServices(newParams);
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
            fetchServices(newParams);
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
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedService ? '서비스 수정' : '새 서비스 추가'}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedService ? '서비스 정보를 수정합니다' : 'KRGeobuk 생태계에 새로운 서비스를 추가합니다'}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          서비스명 (내부용)
                        </span>
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedService?.name || ''}
                        placeholder="auth-service"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">영문, 숫자, 하이픈만 사용 가능</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          표시명 (사용자용)
                        </span>
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedService?.displayName || ''}
                        placeholder="인증 서비스"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">사용자에게 표시될 이름</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        설명
                      </span>
                    </label>
                    <textarea
                      defaultValue={selectedService?.description || ''}
                      placeholder="서비스에 대한 상세 설명을 입력하세요"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* URL 정보 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URL 정보
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          서비스 URL
                        </span>
                      </label>
                      <input
                        type="url"
                        defaultValue={selectedService?.baseUrl || ''}
                        placeholder="https://auth.krgeobuk.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">서비스의 기본 접속 주소</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          아이콘 URL
                        </span>
                      </label>
                      <input
                        type="url"
                        defaultValue={selectedService?.iconUrl || ''}
                        placeholder="https://example.com/icon.svg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">서비스 아이콘 이미지 URL (선택사항)</p>
                    </div>
                  </div>
                </div>

                {/* 가시성 설정 섹션 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    가시성 설정
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 p-3 bg-white rounded-md border border-gray-200 hover:border-violet-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={selectedService?.isVisible || false}
                        className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">포탈에서 표시</span>
                        <p className="text-xs text-gray-500 mt-1">체크하면 포탈 메인 페이지에서 서비스가 표시됩니다</p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3 p-3 bg-white rounded-md border border-gray-200 hover:border-violet-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={selectedService?.isVisibleByRole || false}
                        className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">권한 기반 표시</span>
                        <p className="text-xs text-gray-500 mt-1">특정 역할을 가진 사용자에게만 표시됩니다</p>
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
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {selectedService ? '수정 완료' : '서비스 추가'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* 가시성 설정 모달 */}
        <Modal
          isOpen={isVisibilityModalOpen}
          onClose={handleCloseVisibilityModal}
          title=""
          size="lg"
        >
          <div className="relative -mx-6 -mt-6">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">서비스 가시성 설정</h3>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedService?.displayName || selectedService?.name}의 접근 권한을 관리합니다
                  </p>
                </div>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* 서비스 정보 섹션 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">서비스 정보</h4>
                      <div className="text-sm text-blue-700 mt-2 space-y-1">
                        <p><strong>서비스명:</strong> {selectedService?.displayName || selectedService?.name}</p>
                        <p><strong>URL:</strong> <span className="break-all">{selectedService?.baseUrl}</span></p>
                        <p><strong>현재 상태:</strong> 
                          <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                            !selectedService?.isVisible ? 'bg-red-100 text-red-800' : 
                            selectedService?.isVisibleByRole ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {!selectedService?.isVisible ? '비공개' : selectedService?.isVisibleByRole ? '권한 기반' : '공개'}
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
                    현재 접근 가능한 역할
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedService && getServiceVisibleRoles(selectedService.id).length > 0 ? (
                      getServiceVisibleRoles(selectedService.id).map((roleName, index) => {
                        const role = mockRoles.find(r => r.name === roleName);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <p className="text-gray-500 text-sm">설정된 역할이 없습니다</p>
                        <p className="text-xs text-gray-400 mt-1">모든 사용자가 접근 가능합니다</p>
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
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors">
                      <option value="">추가할 역할을 선택하세요</option>
                      {mockRoles
                        .filter(role => selectedService ? !getServiceVisibleRoles(selectedService.id).includes(role.name) : true)
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} (우선순위: {role.priority})
                          </option>
                        ))}
                    </select>
                    <Button 
                      size="sm" 
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      추가
                    </Button>
                  </div>
                </div>

                {/* 안내사항 섹션 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">가시성 설정 안내</h4>
                      <div className="text-sm text-amber-700 mt-2 space-y-1">
                        <p>• <strong>공개 서비스:</strong> 모든 사용자에게 표시됩니다</p>
                        <p>• <strong>권한 기반:</strong> 특정 역할을 가진 사용자에게만 표시됩니다</p>
                        <p>• <strong>비공개:</strong> 포탈에서 숨겨지며 직접 접근만 가능합니다</p>
                        <p className="text-xs mt-2 text-amber-600">※ "권한 기반 표시" 옵션이 활성화되어야 역할 설정이 적용됩니다</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCloseVisibilityModal} className="transition-all hover:scale-105">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  닫기
                </Button>
                <Button 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all hover:scale-105"
                  onClick={handleCloseVisibilityModal}
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

        {/* 상세보기 모달 */}
        <EnhancedDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          title="서비스 상세 정보"
          subtitle={selectedService?.displayName || selectedService?.name}
          headerIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          headerColor="purple"
          fields={selectedService ? [
            { 
              label: 'ID', 
              value: selectedService.id,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            },
            { 
              label: '서비스명 (내부용)', 
              value: selectedService.name,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            },
            { 
              label: '표시명', 
              value: selectedService.displayName || '-',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            },
            { 
              label: '설명', 
              value: selectedService.description || '-',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '서비스 URL', 
              value: selectedService.baseUrl ? (
                <div className="break-all">
                  <a 
                    href={selectedService.baseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedService.baseUrl}
                  </a>
                </div>
              ) : '-',
              type: 'component',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '아이콘 URL', 
              value: selectedService.iconUrl ? (
                <div className="break-all">
                  <a 
                    href={selectedService.iconUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedService.iconUrl}
                  </a>
                </div>
              ) : '-',
              type: 'component',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '포탈 표시', 
              value: selectedService.isVisible ? '표시됨' : '숨김',
              type: 'badge',
              badgeColor: selectedService.isVisible ? 'green' : 'red',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            },
            { 
              label: '권한 기반 표시', 
              value: selectedService.isVisibleByRole ? '활성화' : '비활성화',
              type: 'badge',
              badgeColor: selectedService.isVisibleByRole ? 'blue' : 'gray',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            },
            { 
              label: '가시성 상태', 
              value: !selectedService.isVisible ? '비공개' : selectedService.isVisibleByRole ? '권한 기반' : '공개',
              type: 'badge',
              badgeColor: !selectedService.isVisible ? 'red' : selectedService.isVisibleByRole ? 'yellow' : 'green',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            },
            { 
              label: '접근 가능한 역할', 
              value: !selectedService.isVisible ? '포탈에서 비공개' : !selectedService.isVisibleByRole ? '모든 사용자' : `${getServiceVisibleRoles(selectedService.id).length}개 역할`,
              type: 'badge',
              badgeColor: !selectedService.isVisible ? 'red' : !selectedService.isVisibleByRole ? 'green' : 'blue',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            },
            { 
              label: '생성일', 
              value: formatDate(selectedService.createdAt), 
              type: 'date',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            },
            { 
              label: '최종 수정일', 
              value: formatDate(selectedService.updatedAt), 
              type: 'date',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          ] : []}
          onEdit={() => {
            handleCloseDetailModal()
            handleOpenModal(selectedService!)
          }}
          onDelete={() => {
            handleCloseDetailModal()
            if (selectedService) {
              handleDeleteService(selectedService)
            }
          }}
        />

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="서비스 삭제"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">서비스를 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{serviceToDelete?.displayName || serviceToDelete?.name}</strong> 서비스를 삭제하면 관련된 모든 설정과 접근 권한이 제거됩니다.
                </p>
              </div>
            </div>
            
            {serviceToDelete && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      서비스 정보
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p><strong>URL:</strong> {serviceToDelete.baseUrl}</p>
                      <p><strong>가시성:</strong> {!serviceToDelete.isVisible ? '비공개' : serviceToDelete.isVisibleByRole ? '권한 기반' : '공개'}</p>
                      {serviceToDelete.isVisible && serviceToDelete.isVisibleByRole && (
                        <p><strong>접근 권한:</strong> {getServiceVisibleRoles(serviceToDelete.id).length}개 역할</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                취소
              </Button>
              <Button variant="danger" onClick={confirmDeleteService}>
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}