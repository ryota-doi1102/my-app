/** 共通エラーコード */
export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

/** 成功レスポンス */
export interface SuccessResponse<T> {
  status_code: number;
  is_success: true;
  data: T;
}

/** エラーレスポンス */
export interface ErrorResponse {
  status_code: number;
  is_success: false;
  error: {
    code: ErrorCode;
    messages: string[];
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/** ユーザー */
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

/** ユーザー作成リクエスト */
export interface CreateUserRequest {
  email: string;
  password: string;
}
