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
}