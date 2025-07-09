export interface User extends Record<string, unknown> {
  id: string
  email: string
  password?: string
  name: string
  nickname?: string
  profileImageUrl?: string
  isEmailVerified: boolean
  isIntegrated: boolean
  createdAt: string
  updatedAt: string
}

export interface Role extends Record<string, unknown> {
  id: string
  name: string
  description?: string
  priority?: number
  serviceId: string
  createdAt: string
  updatedAt: string
}

export interface Permission extends Record<string, unknown> {
  id: string
  action: string
  description?: string
  serviceId: string
  createdAt: string
  updatedAt: string
}

export interface UserRole extends Record<string, unknown> {
  userId: string
  roleId: string
  user: User
  role: Role
}

export interface RolePermission extends Record<string, unknown> {
  roleId: string
  permissionId: string
  role: Role
  permission: Permission
}

export interface Service extends Record<string, unknown> {
  id: string
  name: string
  description?: string
  baseUrl?: string
  isVisible?: boolean
  isVisibleByRole?: boolean
  displayName?: string
  iconUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ServiceVisibleRole extends Record<string, unknown> {
  serviceId: string
  roleId: string
  service: Service
  role: Role
}

export interface OAuthClient extends Record<string, unknown> {
  id: string
  clientId: string
  clientName: string
  redirectUri: string
  scopes: string[]
  status: 'active' | 'inactive'
  createdAt: string
}

export interface OAuthAccount extends Record<string, unknown> {
  id: string
  providerId: string
  provider: 'google' | 'naver' | 'kakao' | 'github'
  userId: string
  createdAt: string
  updatedAt: string
}