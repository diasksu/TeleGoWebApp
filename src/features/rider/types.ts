import type { OfferPriceDto } from "../../common/types";
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
    DriverEnRoute,
    DriverArrived,
    RideInProgress,
    RideCompleted
}

export interface PassengerActiveRideProjection {
    ride: PassengerRideDto;
    origin: PlaceDto;
    destination: PlaceDto;
    driver: PassengerDriverDto;
    driver_user: PassengerDriverUserDto;
    driver_state: PassengerDriverStateDto;
    offer_price: OfferPriceDto;
}

export interface PassengerRideDto {
    id: string;           
    driver_id: string;     
    passenger_id: string;  
    status: RideStatus;
}

export interface PassengerDriverDto {
    user_id: string;    
    rating_sum: number;
    rating_count: number;
}

export interface PassengerDriverUserDto {
    telegram_id: number;
    first_name: string | null;
    user_name: string | null;
}

export interface PassengerDriverStateDto {
    driver_id: string;       
    last_latitude: number;
    last_longitude: number;
    last_heartbeat_at: string;
}

export enum RideStatus {
    DriverOnTheWay = 1,
    Arrived = 2,
    InProgress = 3,
    Completed = 4
}

export interface PassengerRideSnapshotDto {
    ride_id: string;
    driver_state: PassengerDriverStateDto;
    ride_status: RideStatus;
    ride_code: number;
}