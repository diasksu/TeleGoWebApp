import { useEffect } from "react";
import { RiderFlowStep, RideStatus, type PassengerRideSnapshotDto } from "../types";
import { apiClient } from "../../../api/backend";

export function useRideSnapshotPolling(
    flowStep: RiderFlowStep,
    setFlowStep: (step: RiderFlowStep) => void,
    setRideSnapshot: (snapshot: PassengerRideSnapshotDto | null) => void,
    intervalMs: number = 3000
) {
    useEffect(() => {
        if (flowStep !== RiderFlowStep.DriverEnRoute && flowStep !== RiderFlowStep.DriverArrived) return;
        let cancelled = false;
        const interval = setInterval(async () => {
            try {
                const snapshot = await apiClient.get<PassengerRideSnapshotDto>(
                    `/api/me/passenger/ride/snapshot`
                );
                if (cancelled || !snapshot) return;
                setRideSnapshot(snapshot);
                if(snapshot.ride_status === RideStatus.Arrived && flowStep === RiderFlowStep.DriverEnRoute) {
                    setFlowStep(RiderFlowStep.DriverArrived);
                }
                if(snapshot.ride_status === RideStatus.InProgress && flowStep === RiderFlowStep.DriverArrived) {
                    setFlowStep(RiderFlowStep.RideInProgress);
                }
            } catch (e) {
                console.warn('Ride snapshot polling error', e);
            }
        }, intervalMs);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [flowStep, setFlowStep, setRideSnapshot, intervalMs]);
}