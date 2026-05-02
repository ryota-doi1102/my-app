export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  perPage: number
}
