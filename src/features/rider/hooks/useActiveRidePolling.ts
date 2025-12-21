import { useEffect } from 'react';
import { RiderFlowStep } from '../types';
import type { PassengerActiveRideProjection } from '../types';
import { apiClient } from '../../../api/backend';

export function useActiveRidePolling(
    flowStep: RiderFlowStep,
    setFlowStep: (step: RiderFlowStep) => void,
    setActiveRide: (data: PassengerActiveRideProjection | null) => void,
    intervalMs: number = 5000
) {
    useEffect(() => {
        if (flowStep !== RiderFlowStep.WaitingForDriver) return;
        let cancelled = false;
        const interval = setInterval(async () => {
            try {
                const activeRide = await apiClient.get<PassengerActiveRideProjection | null>(
                    '/api/me/passenger/ride'
                );
                if (cancelled) return;
                if (!activeRide) return;
                setActiveRide(activeRide);
                setFlowStep(RiderFlowStep.DriverEnRoute);
            } catch (e) {
                console.warn('Polling error', e);
            }
        }, intervalMs);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [flowStep, setFlowStep, setActiveRide, intervalMs]);
}