import { useEffect, useRef, useState } from "react";

export function useTracking() {
    const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);
    
    const posRef = useRef<google.maps.LatLngLiteral | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startTracking = (
        sendFn: (pos: google.maps.LatLngLiteral) => void,
        intervalMs = 5000
    ) => {
        if (watchIdRef.current !== null) return;

        // 1) GPS stream
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };

                posRef.current = newPos; // always fresh for the interval
                setPosition(newPos);  // for UI
            },
            (err) => console.error("GPS error:", err),
            { enableHighAccuracy: true }
        );

        // 2) periodic sending
        intervalRef.current = setInterval(() => {
            if (posRef.current) {
                sendFn(posRef.current);
            }
        }, intervalMs);
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => stopTracking, []);

    return { position, startTracking, stopTracking };
}
