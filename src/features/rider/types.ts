import type { PlaceDto } from "../../common/utils/addressHelpers";

export interface RideRequestRequest {
    origin: PlaceDto;
    destination: PlaceDto;
    quote_id?: string;
    adjustment: number | null;
}

export interface RideRequestResponse {
    rideRequestId: string;
}

export interface LocationDto {
    place_id: string;
    latitude: number;
    longitude: number;
}

export interface TariffRequest {
    origin: LocationDto;
    destination: LocationDto;
}

export interface TariffResponse {
    estimation: TariffEstimation;
    quote_id: string;
}

export interface TariffEstimation {
    amount: number;
    formatted: string;
    currency: string;
    distance_km: number;
    duration_min: number;
    currency_symbol: string;
    currency_symbol_position: 'before' | 'after';
    adjustment_limit: number;
}

export interface TariffState {
    loading: boolean;
    data: TariffResponse | null;
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