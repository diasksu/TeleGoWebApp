// Типы для различных форматов ошибок API
export interface ApiErrorData {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  details?: string;
  code?: string | number;
}

// Более строгий тип для неизвестных данных
export type UnknownApiError = Record<string, unknown> | string | null;