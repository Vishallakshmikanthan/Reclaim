import { ErrorCode } from "../errors/AppError";

export interface ServiceErrorDetail {
  code: ErrorCode;
  message: string;
  userFacingMessage: string;
  details?: Record<string, any>;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: ServiceErrorDetail;
}

export function successResult<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function errorResult<T = void>(
  code: ErrorCode, 
  message: string, 
  userFacingMessage?: string, 
  details?: Record<string, any>
): ServiceResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      userFacingMessage: userFacingMessage || message,
      details,
    },
  };
}
