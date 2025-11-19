import { useCallback } from 'react';
import { ApiError } from '../../api/backend';
import { useTelegramWebApp } from '@kloktunov/react-telegram-webapp';

export function useApiErrorHandler() {
    const webApp = useTelegramWebApp();
    
    return useCallback((error: unknown, defaultMessage = 'Произошла ошибка') => {
        if (error instanceof ApiError) {
            const message = error.status >= 500 
                ? 'Ошибка сервера. Попробуйте позже'
                : error.getErrorMessage() || defaultMessage;
            
            webApp?.showAlert(message);
            console.error("API Error:", error.status, error.data);
        } else {
            webApp?.showAlert('Проблема с подключением');
            console.error("Unexpected error:", error);
        }
    }, [webApp]);
}