'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/layout/Layout'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import DetailModal from '@/components/common/DetailModal'
import EnhancedDetailModal from '@/components/common/EnhancedDetailModal'
import Modal from '@/components/common/Modal'
import Pagination from '@/components/common/Pagination'
import RoleForm from '@/components/forms/RoleForm'
import SearchFilters from '@/components/common/SearchFilters'
import { Role } from '@/types'
import { PaginatedResultBase, SearchFilters as SearchFiltersType, SortOrderType, LimitType } from '@/types/api'
import { usePagination } from '@/hooks/usePagination'
import { mockRoles, mockServices, mockRolePermissions, mockPermissions } from '@/data/mockData'

export default function RolesPage(): JSX.Element {
  const [roles, setRoles] = useState<Role[]>([])
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({})
  const [permissionModalOpen, setPermissionModalOpen] = useState<boolean>(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const pagination = usePagination()

  // Mock API 호출 함수
  const fetchRoles = useCallback(async (params: any): Promise<void> => {
    setLoading(true)
    try {
      // 최소 로딩 시간 보장 (UX 개선)
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 200))
      
      // 필터링 로직
      let filteredRoles = [...mockRoles]
      
      if (params.name) {
        filteredRoles = filteredRoles.filter(role => 
          role.name.toLowerCase().includes(params.name.toLowerCase())
        )
      }
      
      if (params.serviceId) {
        filteredRoles = filteredRoles.filter(role => 
          role.serviceId === params.serviceId
        )
      }
      
      // 정렬 로직
      if (params.sortBy) {
        filteredRoles.sort((a, b) => {
          const aValue = a[params.sortBy as keyof Role]
          const bValue = b[params.sortBy as keyof Role]
          
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
      const totalItems = filteredRoles.length
      const totalPages = Math.ceil(totalItems / params.limit)
      const startIndex = (params.page - 1) * params.limit
      const endIndex = startIndex + params.limit
      const paginatedRoles = filteredRoles.slice(startIndex, endIndex)
      
      setRoles(paginatedRoles)
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
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    fetchRoles({
      page: 1,
      limit: LimitType.THIRTY,
      sortBy: 'priority',
      sortOrder: SortOrderType.ASC,
    })
  }, [])

  const handleOpenModal = (role?: Role): void => {
    setSelectedRole(role || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = (): void => {
    setIsModalOpen(false)
    setSelectedRole(null)
  }

  const handleOpenDetailModal = (role: Role): void => {
    setSelectedRole(role)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = (): void => {
    setIsDetailModalOpen(false)
    setSelectedRole(null)
  }

  const handleOpenPermissionModal = (role: Role): void => {
    setSelectedRole(role)
    setPermissionModalOpen(true)
  }

  const handleClosePermissionModal = (): void => {
    setPermissionModalOpen(false)
    setSelectedRole(null)
  }

  const handleDeleteRole = (role: Role): void => {
    setRoleToDelete(role)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteRole = (): void => {
    if (roleToDelete) {
      console.log('Deleting role:', roleToDelete.id)
      // 실제로는 API 호출
      setDeleteConfirmOpen(false)
      setRoleToDelete(null)
    }
  }

  const getRolePermissionCount = (roleId: string): number => {
    return mockRolePermissions.filter(rp => rp.roleId === roleId).length
  }

  const getRolePermissions = (roleId: string): string[] => {
    const permissionIds = mockRolePermissions
      .filter(rp => rp.roleId === roleId)
      .map(rp => rp.permissionId)
    
    return mockPermissions
      .filter(permission => permissionIds.includes(permission.id))
      .map(permission => permission.action)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatPriority = (priority: number): JSX.Element => {
    const priorityColors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-lime-100 text-lime-800',
      5: 'bg-green-100 text-green-800',
      6: 'bg-teal-100 text-teal-800',
      7: 'bg-blue-100 text-blue-800',
      8: 'bg-indigo-100 text-indigo-800',
      9: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    )
  }

  const getServiceName = (serviceId: string): string => {
    const service = mockServices.find(s => s.id === serviceId)
    return service?.displayName || '알 수 없음'
  }

  // 검색 필터 필드 정의
  const searchFields = [
    {
      key: 'name',
      label: '역할 이름',
      type: 'text' as const,
      placeholder: '역할 이름을 입력하세요'
    },
    {
      key: 'serviceId',
      label: '서비스',
      type: 'select' as const,
      options: mockServices.map(service => ({
        value: service.id,
        label: service.displayName || service.name
      }))
    }
  ]

  const columns = [
    { key: 'name' as keyof Role, label: '역할 이름', sortable: true },
    { key: 'description' as keyof Role, label: '설명', sortable: false },
    { 
      key: 'serviceId' as keyof Role, 
      label: '서비스',
      sortable: false,
      render: (value: Role[keyof Role]) => getServiceName(String(value))
    },
    { 
      key: 'priority' as keyof Role, 
      label: '우선순위', 
      sortable: true,
      render: (value: Role[keyof Role]) => formatPriority(Number(value))
    },
    { 
      key: 'permissionCount' as keyof Role, 
      label: '권한 수',
      sortable: false,
      render: (value: Role[keyof Role], row: Role) => {
        const permissionCount = getRolePermissionCount(row.id)
        return (
          <div className="flex justify-center">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {permissionCount}개
            </span>
          </div>
        )
      }
    },
    {
      key: 'actions' as keyof Role,
      label: '작업',
      sortable: false,
      render: (value: Role[keyof Role], row: Role) => (
        <div className="flex justify-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenDetailModal(row)}>
            상세보기
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(row)}>
            수정
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenPermissionModal(row)}>
            권한 설정
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteRole(row)}>
            삭제
          </Button>
        </div>
      )
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">역할 관리</h1>
                <p className="text-white/80 mt-1">
                  시스템 역할을 생성하고 관리합니다. 각 역할에 권한을 부여하여 접근 제어를 설정할 수 있습니다.
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleOpenModal()}
              className="!bg-white !text-green-700 hover:!bg-green-50 hover:!text-green-800 font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105 shadow-lg border border-green-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 역할 추가
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
            fetchRoles(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchRoles])}
          onReset={useCallback(() => {
            setCurrentFilters({});
            const newParams = { 
              page: 1, 
              limit: pagination.limit, 
              sortBy: pagination.sortBy, 
              sortOrder: pagination.sortOrder 
            };
            pagination.goToPage(1);
            fetchRoles(newParams);
          }, [pagination.limit, pagination.sortBy, pagination.sortOrder, pagination.goToPage, fetchRoles])}
        />

        <Table 
          data={roles} 
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
            fetchRoles(newParams);
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
            fetchRoles(newParams);
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
            fetchRoles(newParams);
          }}
        />

        <RoleForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          role={selectedRole}
          showPermissionTab={false}
          onSubmit={(data) => {
            console.log('Role form submitted:', data)
            handleCloseModal()
          }}
          onPermissionUpdate={(roleId, permissions) => {
            console.log('Permission updated for role:', roleId, permissions)
          }}
        />

        <EnhancedDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          title="역할 상세 정보"
          subtitle={selectedRole?.name}
          headerIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          headerColor="green"
          fields={[
            { 
              label: 'ID', 
              value: selectedRole?.id,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            },
            { 
              label: '역할 이름', 
              value: selectedRole?.name,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            },
            { 
              label: '설명', 
              value: selectedRole?.description,
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>,
              fullWidth: true
            },
            { 
              label: '서비스', 
              value: selectedRole ? getServiceName(selectedRole.serviceId) : null,
              type: 'badge',
              badgeColor: 'blue',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            },
            { 
              label: '우선순위', 
              value: selectedRole ? formatPriority(selectedRole.priority || 5) : null,
              type: 'component',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            },
            { 
              label: '보유 권한', 
              value: selectedRole ? `${getRolePermissionCount(selectedRole.id)}개` : null,
              type: 'badge',
              badgeColor: 'purple',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            },
            { 
              label: '생성일', 
              value: selectedRole ? formatDate(selectedRole.createdAt) : null,
              type: 'date',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            },
            { 
              label: '수정일', 
              value: selectedRole ? formatDate(selectedRole.updatedAt) : null,
              type: 'date',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          ]}
          onEdit={() => {
            handleCloseDetailModal()
            handleOpenModal(selectedRole!)
          }}
          onDelete={() => {
            handleCloseDetailModal()
            if (selectedRole) {
              handleDeleteRole(selectedRole)
            }
          }}
        />

        {/* 권한 설정 모달 */}
        <Modal
          isOpen={permissionModalOpen}
          onClose={handleClosePermissionModal}
          title=""
          size="lg"
        >
          <div className="relative -mx-6 -mt-6">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">권한 설정</h3>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedRole?.name} 역할의 권한을 관리합니다
                  </p>
                </div>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* 역할 정보 섹션 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-green-800">역할 정보</h4>
                      <div className="text-sm text-green-700 mt-2 space-y-1">
                        <p><strong>이름:</strong> {selectedRole?.name}</p>
                        <p><strong>설명:</strong> {selectedRole?.description}</p>
                        <p><strong>서비스:</strong> {selectedRole ? getServiceName(selectedRole.serviceId) : ''}</p>
                        <p><strong>우선순위:</strong> {selectedRole?.priority}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 권한 검색 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      권한 검색
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="권한을 검색하세요..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                  />
                </div>

                {/* 권한 목록 */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* 전체 선택/해제 버튼 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">전체 권한</h4>
                          <p className="text-xs text-gray-500">{mockPermissions.length}개 권한</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 transition-all hover:scale-105"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        전체 선택
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {/* 서비스별로 그룹화된 권한 목록 */}
                    {mockServices.map((service) => {
                      const servicePermissions = mockPermissions.filter(p => p.serviceId === service.id);
                      if (servicePermissions.length === 0) return null;
                      
                      return (
                        <div key={service.id} className="border-b border-gray-100 last:border-b-0">
                          <div className="bg-gradient-to-r from-green-50 to-teal-50 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{service.displayName || service.name}</h4>
                                <p className="text-xs text-gray-500">{servicePermissions.length}개 권한</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50 transition-all hover:scale-105"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              전체 선택
                            </Button>
                          </div>
                          <div className="p-3 space-y-2">
                            {servicePermissions.map((permission) => {
                              const isSelected = mockRolePermissions.some(rp => 
                                rp.roleId === selectedRole?.id && rp.permissionId === permission.id
                              );
                              return (
                                <label key={permission.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all">
                                  <input
                                    type="checkbox"
                                    defaultChecked={isSelected}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900">{permission.action.split(':')[0]}</span>
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {permission.action.split(':')[1]}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">{permission.description}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 선택된 권한 개수 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedRole ? getRolePermissionCount(selectedRole.id) : 0}개 권한 선택됨
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleClosePermissionModal} 
                  className="transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  취소
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Permission updated for role:', selectedRole?.id);
                    handleClosePermissionModal();
                  }}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  권한 저장
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="역할 삭제"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">역할을 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{roleToDelete?.name}</strong> 역할을 삭제하면 이 역할을 가진 모든 사용자의 권한이 제거됩니다.
                </p>
              </div>
            </div>
            
            {roleToDelete && getRolePermissionCount(roleToDelete.id) > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      현재 {getRolePermissionCount(roleToDelete.id)}개 권한 보유
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>보유 권한: {getRolePermissions(roleToDelete.id).slice(0, 3).join(', ')}</p>
                      {getRolePermissions(roleToDelete.id).length > 3 && (
                        <p>외 {getRolePermissions(roleToDelete.id).length - 3}개 더</p>
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
              <Button variant="danger" onClick={confirmDeleteRole}>
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}