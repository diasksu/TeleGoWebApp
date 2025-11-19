import { ApiClient } from './apiClient';

// Функция для безопасного получения initData
function getInitData(): string | null {
  try {
    return window.Telegram?.WebApp?.initData || null;
  } catch (error) {
    // В случае SSR или тестов window может быть undefined
    console.warn('Telegram WebApp not available:', error);
    return null;
  }
}

// Создаем и экспортируем готовый экземпляр
export const apiClient = new ApiClient(getInitData());

// Функция для создания клиента с кастомными данными (полезно для тестов)
export const createApiClient = (initData?: string | null) => {
  return new ApiClient(initData);
};

// Экспорты классов и типов
export { ApiClient, ApiError } from './apiClient';
export type { ApiErrorData, UnknownApiError } from './types';