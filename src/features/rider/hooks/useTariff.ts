import { useState, useCallback } from 'react';
import { tariffService } from '../services/tariffService';
import type { TariffState } from '../types';

export function useTariff() {
    const [tariffState, setTariffState] = useState<TariffState>({
        loading: false,
        data: null,
        error: null
    });

    const calculateTariff = useCallback(async (
        origin: google.maps.places.PlaceResult,
        destination: google.maps.places.PlaceResult
    ) => {
        setTariffState({ loading: true, data: null, error: null });
        try {
            const data = await tariffService.calculateTariff(origin, destination);
            setTariffState({ loading: false, data, error: null });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to calculate fare';
            setTariffState({ loading: false, data: null, error: message });
        }
    }, []);

    return { tariffState, calculateTariff };
}