import { useState, useCallback } from 'react';
import { RoleService } from '@/services/roleService';
import { RolePermissionService } from '@/services/rolePermissionService';
import type { RoleSearchQuery, RoleSearchResult, RoleDetail } from '@krgeobuk/role';
import type { PermissionDetail } from '@krgeobuk/permission';
import type { PaginatedResult } from '@krgeobuk/core';

interface CreateRoleData {
  name: string;
  description?: string;
  priority: number;
  serviceId: string;
}

interface UpdateRoleData {
  name?: string;
  description?: string;
  priority?: number;
  serviceId?: string;
}

export function useRoles() {
  const [roles, setRoles] = useState<RoleSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async (query: RoleSearchQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await RoleService.getRoles(query);
      setRoles(response.data.items);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '역할 목록 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoleById = useCallback(async (id: string): Promise<RoleDetail> => {
    setLoading(true);
    setError(null);
    try {
      const response = await RoleService.getRoleById(id);
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '역할 상세 정보 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: CreateRoleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await RoleService.createRole(roleData);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '역할 생성에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (id: string, roleData: UpdateRoleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await RoleService.updateRole(id, roleData);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '역할 수정에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await RoleService.deleteRole(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '역할 삭제에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRolePermissions = useCallback(async (roleId: string): Promise<PermissionDetail[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await RolePermissionService.getRolePermissions(roleId);
      return response.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '역할 권한 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignPermissionToRole = useCallback(async (roleId: string, permissionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await RolePermissionService.assignPermissionToRole(roleId, permissionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '권한 할당에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removePermissionFromRole = useCallback(async (roleId: string, permissionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await RolePermissionService.removePermissionFromRole(roleId, permissionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '권한 제거에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignMultiplePermissionsToRole = useCallback(
    async (roleId: string, permissionIds: string[]) => {
      setLoading(true);
      setError(null);
      try {
        await RolePermissionService.assignMultiplePermissionsToRole(roleId, permissionIds);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '여러 권한 할당에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    roles,
    loading,
    error,
    fetchRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    assignPermissionToRole,
    removePermissionFromRole,
    assignMultiplePermissionsToRole,
  };
}
