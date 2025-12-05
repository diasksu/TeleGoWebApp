import { useEffect, useRef, useState } from "react";

export function useTracking() {
    const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const startTracking = (initialPosition: google.maps.LatLngLiteral) => {
        if (watchIdRef.current !== null) return;
        setPosition(initialPosition);
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
            },
            (err) => console.error("GPS error:", err),
            { enableHighAccuracy: true }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopTracking();
    }, []);

    return { position, startTracking, stopTracking };
}
