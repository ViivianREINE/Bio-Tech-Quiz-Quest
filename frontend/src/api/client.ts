import type { ApiResponse } from '../types';

// Normalize BASE_URL so that whether VITE_API_URL is 'https://domain.com', 'https://domain.com/api', or 'http://localhost:5000',
// it cleanly targets the backend API root.
const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) {
    return 'https://bio-tech-quiz-quest.onrender.com/api';
  }
  // Strip trailing slashes
  const clean = envUrl.replace(/\/+$/, '');
  if (clean.endsWith('/api')) {
    return clean;
  }
  return `${clean}/api`;
};

const BASE_URL = getApiBaseUrl();

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

  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else {
    // Strip leading /api if passed
    const cleanEndpoint = endpoint.replace(/^\/?api\/?/, '').replace(/^\//, '');
    url = `${BASE_URL}/${cleanEndpoint}`;
  }

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
