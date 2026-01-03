import { useCallback } from 'react';

/**
 * Hook to get the user's current location.
 * It first tries to use Telegram's LocationManager,
 * then falls back to the standard navigator.geolocation API.
 */
export function useCurrentLocation() {
    const getCurrentLocation = useCallback(async (): Promise<google.maps.LatLngLiteral | null> => {

        // // First try to use Telegram LocationManager
        // const locationManager = window.Telegram?.WebApp?.LocationManager;
        // if (locationManager?.isLocationAvailable) {
        //     locationManager.getLocation((location: LocationData | null) => {
        //         if (location) {
        //             resolve({ lat: location.latitude, lng: location.longitude });
        //         } else {
        //             resolve(center);
        //         }
        //     });
        //     return;
        // }

        // Fallback to standard geolocation API
        if (!navigator.geolocation) return null;
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (permission.state === 'denied') {
                return null;
            }
            return new Promise(resolve => {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    }),
                    () => resolve(null),
                    { enableHighAccuracy: true }
                );
            });
        } catch {
            return null;
        }

    }, []);

    return { getCurrentLocation };
}