class EnvironmentConfig {
  public readonly googleMapsApiKey: string;
  public readonly apiBaseUrl: string;
  public readonly environment: string;
  public readonly isDevelopment: boolean;
  public readonly isProduction: boolean;

  constructor() {
    // Проверяем наличие обязательных переменных
    this.validateRequiredEnvVars();

    this.googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.isDevelopment = this.environment === 'development' || this.environment === 'local';
    this.isProduction = this.environment === 'production';
  }

  private validateRequiredEnvVars(): void {
    const required = [
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_API_BASE_URL'
    ];

    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
      );
    }
  }

  public getApiUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
}

// Экспортируем синглтон
export const env = new EnvironmentConfig();