import type { PlaceDto } from "../../common/utils/addressHelpers";

export interface RideRequestRequest {
    origin: PlaceDto;
    destination: PlaceDto;
}

export interface RideRequestResponse {
    rideRequestId: string;
}

export interface LocationDto {
    latitude: number;
    longitude: number;
}

export interface TariffRequest {
    origin: LocationDto;
    destination: LocationDto;
}

export interface TariffInfo {
    amount: number;
    formatted: string;
    currency: string;
    distance_km: number;
    duration_min: number;
}

export interface TariffState {
    loading: boolean;
    data: TariffInfo | null;
    error: string | null;
}

export enum RiderFlowStep {
    DefiningRoute,
    WaitingForDriver,
    DriverAssigned,
    DriverEnRoute,
    RideInProgress,
    RideCompleted
}