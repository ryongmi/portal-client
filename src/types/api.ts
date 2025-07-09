export enum LimitType {
  TEN = 10,
  TWENTY = 20,
  THIRTY = 30,
  FIFTY = 50,
  ONE_HUNDRED = 100
}

export enum SortOrderType {
  ASC = 'ASC',
  DESC = 'DESC'
}

export enum SortByBaseType {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export interface PaginationQuery {
  page?: number
  limit?: LimitType
  sortOrder?: SortOrderType
  sortBy?: string
}

export interface PaginatedResultBase {
  page: number
  limit: LimitType
  totalItems: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ResponseFormat<T> {
  code: string
  statusCode: number
  message: string
  isLogin: boolean
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  pageInfo: PaginatedResultBase
}

export interface SearchFilters {
  [key: string]: string | number | boolean | undefined
}