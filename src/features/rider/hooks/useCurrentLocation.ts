import { useCallback } from 'react';

const center = { lat: 36.910894, lng: 30.720875 };

/**
 * Hook to get the user's current location.
 * It first tries to use Telegram's LocationManager,
 * then falls back to the standard navigator.geolocation API.
 */
export function useCurrentLocation() {
    const getCurrentLocation = useCallback(async (): Promise<google.maps.LatLngLiteral | null> => {
        return new Promise<google.maps.LatLngLiteral | null>((resolve) => {
            const locationManager = window.Telegram?.WebApp?.LocationManager;
            
            // First try to use Telegram LocationManager
            if (locationManager?.isLocationAvailable) {
                locationManager.getLocation((location: LocationData | null) => {
                    if (location) {
                        resolve({ lat: location.latitude, lng: location.longitude });
                    } else {
                        resolve(center);
                    }
                });
                return;
            }
            
            // Fallback to standard geolocation API
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), 
                    error => { 
                        console.error("Geolocation error:", error);
                        resolve(center); 
                    }, 
                    { enableHighAccuracy: true, timeout: 300 }
                ); 
                return; 
            }
            
            // If nothing is available
            resolve(center);            
        });
    }, []);

    return { getCurrentLocation };
}