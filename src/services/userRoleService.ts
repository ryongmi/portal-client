import { authzApi } from "@/lib/axios";
import type { ApiResponse } from "@/lib/axios";

// 공유 라이브러리 인터페이스 활용
import type { RoleDetail } from "@krgeobuk/role";

// 사용자-역할 관계 관리를 위한 타입 정의
interface AssignRoleToUserRequest {
  userId: string;
  roleId: string;
}

export class UserRoleService {
  /**
   * 사용자의 역할 목록 조회
   */
  static async getUserRoles(userId: string): Promise<ApiResponse<RoleDetail[]>> {
    const response = await authzApi.get<ApiResponse<RoleDetail[]>>(
      `/user-roles/users/${userId}`
    );
    return response.data;
  }

  /**
   * 사용자에게 역할 할당
   */
  static async assignRoleToUser(
    data: AssignRoleToUserRequest
  ): Promise<ApiResponse<null>> {
    const response = await authzApi.post<ApiResponse<null>>(
      "/user-roles",
      data
    );
    return response.data;
  }

  /**
   * 사용자에서 역할 제거
   */
  static async removeRoleFromUser(
    userId: string,
    roleId: string
  ): Promise<ApiResponse<null>> {
    const response = await authzApi.delete<ApiResponse<null>>(
      `/user-roles/users/${userId}/roles/${roleId}`
    );
    return response.data;
  }

  /**
   * 벌크 역할 할당 (여러 역할을 한 번에 할당)
   */
  static async assignMultipleRolesToUser(
    userId: string,
    roleIds: string[]
  ): Promise<void> {
    // 순차적으로 역할 할당 (백엔드에 벌크 API가 없는 경우)
    const promises = roleIds.map(roleId =>
      this.assignRoleToUser({ userId, roleId })
    );
    await Promise.all(promises);
  }

  /**
   * 벌크 역할 제거 (여러 역할을 한 번에 제거)
   */
  static async removeMultipleRolesFromUser(
    userId: string,
    roleIds: string[]
  ): Promise<void> {
    // 순차적으로 역할 제거
    const promises = roleIds.map(roleId =>
      this.removeRoleFromUser(userId, roleId)
    );
    await Promise.all(promises);
  }
}