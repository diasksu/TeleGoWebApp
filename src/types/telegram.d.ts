declare global {
  /** Telegram WebApp расширенный тип с LocationManager */
  interface TelegramWebApp {
    initData?: string;
    LocationManager?: LocationManager;
  }

  interface LocationManager {
    isAccessGranted: boolean;
    isAccessRequested: boolean;
    isLocationAvailable: boolean;
    isInited: boolean;
    openSettings: () => LocationManager;
    init: (callback?: () => void) => LocationManager;
    getLocation: (
      callback: (loc: LocationData | null) => void
    ) => LocationManager;
  }

  /** Данные о текущем положении устройства */
  interface LocationData {
    latitude: number;
    longitude: number;
    altitude: number | null;
    course: number | null;
    speed: number | null;
    horizontal_accuracy: number | null;
    vertical_accuracy: number | null;
    course_accuracy: number | null;
    speed_accuracy: number | null;
  }

  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export {};
