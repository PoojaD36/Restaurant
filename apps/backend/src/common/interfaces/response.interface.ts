/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard API response with success, message, and optional data
 */
export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Paginated API response with metadata
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}
