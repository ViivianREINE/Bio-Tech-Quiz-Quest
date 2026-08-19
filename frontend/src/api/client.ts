import type { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const getToken = (): string | null => {
  return localStorage.getItem('btqq_jwt_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('btqq_jwt_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('btqq_jwt_token');
};

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Unable to parse server response' },
    }));

    if (!response.ok || !json.success) {
      const code = json.error?.code || `HTTP_${response.status}`;
      const message = json.error?.message || response.statusText || 'Unknown server error';
      
      // Auto handle 401 Unauthorized
      if (response.status === 401) {
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      throw new ApiError(response.status, code, message, json.error?.details);
    }

    return json.data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      0,
      'NETWORK_FAILURE',
      'Research servers are unreachable. Please verify your connection or check if backend is running.',
      err
    );
  }
}
