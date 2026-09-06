import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export function successResponse<T>(data: T, message: string | null = null, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
    error: null,
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(message: string, code = 'INTERNAL_ERROR', status = 400, details?: any) {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    message,
    error: {
      code,
      details,
    },
  };
  return NextResponse.json(body, { status });
}
