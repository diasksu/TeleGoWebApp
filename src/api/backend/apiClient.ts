import axios, { 
    type AxiosInstance, 
    type AxiosRequestConfig, 
    type AxiosError 
} from 'axios';
import { env } from '../../env/config';
import type { ApiErrorData, UnknownApiError } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: ApiErrorData | UnknownApiError,
    public statusText: string
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  // Хелпер для получения сообщения об ошибке
  getErrorMessage(): string {
    if (!this.data) {
      return this.statusText;
    }

    if (typeof this.data === 'string') {
      return this.data;
    }

    if (typeof this.data === 'object' && 'message' in this.data) {
      return (typeof this.data.message === 'string' ? this.data.message : '') || this.statusText;
    }

    if (typeof this.data === 'object' && 'error' in this.data) {
      return (typeof this.data.error === 'string' ? this.data.error : '') || this.statusText;
    }

    return this.statusText;
  }

  // Хелпер для получения детальных ошибок валидации
  getValidationErrors(): Record<string, string[]> | null {
    if (
      this.data && 
      typeof this.data === 'object' && 
      'errors' in this.data &&
      typeof this.data.errors === 'object'
    ) {
      return this.data.errors as Record<string, string[]>;
    }
    return null;
  }
}

export class ApiClient {
 private client: AxiosInstance;

  constructor(initData?: string | null) {
    this.client = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(initData && { 'Authorization': `tma ${initData}` }),
      },
    });

    // Интерсептор для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError = new ApiError(
          error.response?.status || 0,
          error.response?.data as ApiErrorData | UnknownApiError,
          error.response?.statusText || 'Unknown Error'
        );
        return Promise.reject(apiError);
      }
    );
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}