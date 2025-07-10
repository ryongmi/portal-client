import { authzApi } from "@/lib/axios";
import type { ApiResponse } from "@/lib/axios";

// 공유 라이브러리 인터페이스 활용
import type { PermissionDetail } from "@krgeobuk/permission";

// 역할-권한 관계 관리를 위한 타입 정의
interface AssignPermissionToRoleRequest {
  roleId: string;
  permissionId: string;
}

export class RolePermissionService {
  /**
   * 역할의 권한 목록 조회
   */
  static async getRolePermissions(roleId: string): Promise<ApiResponse<PermissionDetail[]>> {
    const response = await authzApi.get<ApiResponse<PermissionDetail[]>>(
      `/role-permissions/roles/${roleId}`
    );
    return response.data;
  }

  /**
   * 역할에 권한 할당
   */
  static async assignPermissionToRole(
    data: AssignPermissionToRoleRequest
  ): Promise<ApiResponse<null>> {
    const response = await authzApi.post<ApiResponse<null>>(
      "/role-permissions",
      data
    );
    return response.data;
  }

  /**
   * 역할에서 권한 제거
   */
  static async removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Promise<ApiResponse<null>> {
    const response = await authzApi.delete<ApiResponse<null>>(
      `/role-permissions/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  }

  /**
   * 벌크 권한 할당 (여러 권한을 한 번에 할당)
   */
  static async assignMultiplePermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    // 순차적으로 권한 할당 (백엔드에 벌크 API가 없는 경우)
    const promises = permissionIds.map(permissionId =>
      this.assignPermissionToRole({ roleId, permissionId })
    );
    await Promise.all(promises);
  }

  /**
   * 벌크 권한 제거 (여러 권한을 한 번에 제거)
   */
  static async removeMultiplePermissionsFromRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    // 순차적으로 권한 제거
    const promises = permissionIds.map(permissionId =>
      this.removePermissionFromRole(roleId, permissionId)
    );
    await Promise.all(promises);
  }
}