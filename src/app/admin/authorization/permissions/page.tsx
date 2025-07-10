'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/layout/Layout'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import DetailModal from '@/components/common/DetailModal'
import EnhancedDetailModal from '@/components/common/EnhancedDetailModal'
import Modal from '@/components/common/Modal'
import Pagination from '@/components/common/Pagination'
import SearchFilters from '@/components/common/SearchFilters'
import PermissionForm from '@/components/forms/PermissionForm'
import {
  PaginatedResultBase,
  SearchFilters as SearchFiltersType,
  SortOrderType,
  LimitType,
} from '@/types/api'
import { usePagination } from '@/hooks/usePagination'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionSearchQuery, PermissionSearchResult, PermissionDetail } from '@krgeobuk/permission'
import type { Service } from '@krgeobuk/service'

export default function PermissionsPage(): JSX.Element {
  const [permissions, setPermissions] = useState<PermissionSearchResult[]>([])
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [selectedPermission, setSelectedPermission] = useState<PermissionSearchResult | null>(null)
  const [permissionDetail, setPermissionDetail] = useState<PermissionDetail | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
  const [permissionToDelete, setPermissionToDelete] = useState<PermissionSearchResult | null>(null)
  const [services, setServices] = useState<Service[]>([])

  const pagination = usePagination()
  const permissionHooks = usePermissions()

  // API 호출 함수
  const fetchPermissions = useCallback(
    async (params: PermissionSearchQuery): Promise<void> => {
      setLoading(true)
      try {
        const response = await permissionHooks.fetchPermissions(params)
        setPermissions(response.items)
        setPageInfo(response.pageInfo)
      } catch (error) {
        console.error('권한 목록 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    },
    [permissionHooks]
  )

  // 서비스 목록 조회 (필터링용)
  const fetchServices = useCallback(async (): Promise<void> => {
    try {
      // 서비스 목록 조회 API 호출 (임시로 빈 배열)
      // const response = await ServiceService.getServices()
      // setServices(response.data.items)
      setServices([]) // 임시
    } catch (error) {
      console.error('서비스 목록 조회 실패:', error)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    fetchPermissions({
      page: 1,
      limit: LimitType.THIRTY,
      sortBy: 'action',
      sortOrder: SortOrderType.ASC,
    })
    fetchServices()
  }, [fetchPermissions, fetchServices])

  const handleOpenModal = (permission?: PermissionSearchResult): void => {
    setSelectedPermission(permission || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = (): void => {
    setIsModalOpen(false)
    setSelectedPermission(null)
  }

  const handleOpenDetailModal = async (permission: PermissionSearchResult): Promise<void> => {
    try {
      if (permission.id) {
        const detail = await permissionHooks.getPermissionById(permission.id)
        setPermissionDetail(detail)
        setSelectedPermission(permission)
        setIsDetailModalOpen(true)
      }
    } catch (error) {
      console.error('권한 상세 정보 조회 실패:', error)
    }
  }

  const handleCloseDetailModal = (): void => {
    setIsDetailModalOpen(false)
    setSelectedPermission(null)
    setPermissionDetail(null)
  }

  const handleDeletePermission = (permission: PermissionSearchResult): void => {
    setPermissionToDelete(permission)
    setDeleteConfirmOpen(true)
  }

  const confirmDeletePermission = async (): Promise<void> => {
    if (permissionToDelete?.id) {
      try {
        await permissionHooks.deletePermission(permissionToDelete.id)
        // 삭제 성공 시 목록 새로고침
        await fetchPermissions({
          page: pagination.currentPage,
          limit: pagination.limit,
          sortBy: pagination.sortBy,
          sortOrder: pagination.sortOrder,
          ...currentFilters,
        })
        setDeleteConfirmOpen(false)
        setPermissionToDelete(null)
      } catch (error) {
        console.error('권한 삭제 실패:', error)
      }
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatAction = (action: string): JSX.Element => {
    const [resource, actionType] = action.split(':')
    const actionColors = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-green-100 text-green-800',
      delete: 'bg-red-100 text-red-800',
      create: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <div className="flex flex-col">
        <span className="font-medium">{resource}</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block mt-1 ${actionColors[actionType as keyof typeof actionColors] || 'bg-gray-100 text-gray-800'}`}>
          {actionType}
        </span>
      </div>
    )
  }

  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId)
    return service?.displayName || service?.name || '알 수 없음'
  }

  const getUsedRoleCount = (permissionId: string): number => {
    // 역할-권한 관계 조회 API 호출 필요
    // 임시로 0 반환
    return 0
  }

  const getUsedRoles = (permissionId: string): string[] => {
    // 역할-권한 관계 조회 API 호출 필요
    // 임시로 빈 배열 반환
    return []
  }

  // 유니크한 리소스 및 액션 타입 추출
  const getUniqueResources = (): string[] => {
    const resources = new Set<string>()
    permissions.forEach(permission => {
      const [resource] = permission.action.split(':')
      if (resource) resources.add(resource)
    })
    return Array.from(resources)
  }

  const getUniqueActionTypes = (): string[] => {
    const actionTypes = new Set<string>()
    permissions.forEach(permission => {
      const [, actionType] = permission.action.split(':')
      if (actionType) actionTypes.add(actionType)
    })
    return Array.from(actionTypes)
  }

  // 검색 필터 필드 정의
  const searchFields = [
    {
      key: 'action',
      label: '권한 액션',
      type: 'text' as const,
      placeholder: '권한 액션을 입력하세요 (예: user:read)'
    },
    {
      key: 'description',
      label: '설명',
      type: 'text' as const,
      placeholder: '설명을 입력하세요'
    },
    {
      key: 'serviceId',
      label: '서비스',
      type: 'select' as const,
      options: services.map(service => ({
        value: service.id,
        label: service.displayName || service.name
      }))
    },
    {
      key: 'resource',
      label: '리소스',
      type: 'select' as const,
      options: getUniqueResources().map(resource => ({
        value: resource,
        label: resource
      }))
    },
    {
      key: 'actionType',
      label: '액션 타입',
      type: 'select' as const,
      options: getUniqueActionTypes().map(actionType => ({
        value: actionType,
        label: actionType
      }))
    }
  ]

  const columns = [
    { 
      key: 'action' as keyof PermissionSearchResult, 
      label: '권한', 
      sortable: true,
      render: (value: PermissionSearchResult[keyof PermissionSearchResult]) => formatAction(String(value))
    },
    { key: 'description' as keyof PermissionSearchResult, label: '설명', sortable: false },
    { 
      key: 'serviceId' as keyof PermissionSearchResult, 
      label: '서비스',
      sortable: false,
      render: (value: PermissionSearchResult[keyof PermissionSearchResult]) => getServiceName(String(value))
    },
    { 
      key: 'usedRoles' as keyof PermissionSearchResult, 
      label: '사용중인 역할',
      sortable: false,
      render: (value: PermissionSearchResult[keyof PermissionSearchResult], row: PermissionSearchResult) => {
        const roleCount = getUsedRoleCount(row.id || '')
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm w-fit">
            {roleCount}개
          </span>
        )
      }
    },
    {
      key: 'actions' as keyof PermissionSearchResult,
      label: '작업',
      sortable: false,
      render: (value: PermissionSearchResult[keyof PermissionSearchResult], row: PermissionSearchResult) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenDetailModal(row)}>
            상세보기
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(row)}>
            수정
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeletePermission(row)}>
            삭제
          </Button>
        </div>
      )
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">권한 관리</h1>
                <p className="text-white/80 mt-1">
                  시스템 권한을 생성하고 관리합니다. 각 권한은 "resource:action" 형식으로 정의됩니다.
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleOpenModal()}
              className="!bg-white !text-purple-700 hover:!bg-purple-50 hover:!text-purple-800 font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 shadow-lg border border-purple-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 권한 추가
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
            fetchPermissions(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchPermissions])}
          onReset={useCallback(() => {
            setCurrentFilters({});
            const newParams = { 
              page: 1, 
              limit: pagination.limit, 
              sortBy: pagination.sortBy, 
              sortOrder: pagination.sortOrder 
            };
            pagination.goToPage(1);
            fetchPermissions(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchPermissions])}
        />

        <Table 
          data={permissions} 
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
            fetchPermissions(newParams);
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
            fetchPermissions(newParams);
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
            fetchPermissions(newParams);
          }}
        />

        <PermissionForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          permission={selectedPermission}
          onSubmit={async (data) => {
            try {
              if (selectedPermission?.id) {
                // 수정
                await permissionHooks.updatePermission(selectedPermission.id, data)
              } else {
                // 생성
                await permissionHooks.createPermission(data)
              }
              // 성공 시 목록 새로고침
              await fetchPermissions({
                page: pagination.currentPage,
                limit: pagination.limit,
                sortBy: pagination.sortBy,
                sortOrder: pagination.sortOrder,
                ...currentFilters,
              })
              handleCloseModal()
            } catch (error) {
              console.error('권한 저장 실패:', error)
            }
          }}
        />

        <EnhancedDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          title="권한 상세 정보"
          subtitle={selectedPermission?.action}
          headerIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          headerColor="blue"
          fields={[
            { 
              label: 'ID', 
              value: permissionDetail?.id || selectedPermission?.id,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            },
            { 
              label: '권한 액션', 
              value: permissionDetail ? formatAction(permissionDetail.action) : selectedPermission ? formatAction(selectedPermission.action) : null,
              type: 'component',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '설명', 
              value: permissionDetail?.description || selectedPermission?.description,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '서비스', 
              value: permissionDetail ? getServiceName(permissionDetail.service?.id || '') : selectedPermission ? getServiceName(selectedPermission.serviceId || '') : null,
              type: 'badge',
              badgeColor: 'blue',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            },
            { 
              label: '사용중인 역할', 
              value: permissionDetail ? `${permissionDetail.roles?.length || 0}개` : selectedPermission ? `${getUsedRoleCount(selectedPermission.id || '')}개` : null,
              type: 'badge',
              badgeColor: 'green',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          ]}
          onEdit={() => {
            handleCloseDetailModal()
            handleOpenModal(selectedPermission!)
          }}
          onDelete={() => {
            handleCloseDetailModal()
            if (selectedPermission) {
              handleDeletePermission(selectedPermission)
            }
          }}
        />

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="권한 삭제"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">권한을 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{permissionToDelete?.action}</strong> 권한을 삭제하면 이 권한을 사용하는 모든 역할에서 제거됩니다.
                </p>
              </div>
            </div>
            
            {permissionToDelete && getUsedRoleCount(permissionToDelete.id || '') > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      현재 {getUsedRoleCount(permissionToDelete.id || '')}개 역할에서 사용중
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>사용중인 역할: {getUsedRoles(permissionToDelete.id || '').join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                취소
              </Button>
              <Button variant="danger" onClick={confirmDeletePermission}>
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}