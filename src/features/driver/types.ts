import type { OfferPriceDto } from "../../common/types";

export enum DriverFlowStep {
    Offline,         
    Online,      
    OrderPreview,   
    RideAssigned,   
    GoingToPickup,   
    ArrivedAtPickup, 
    RideInProgress,  
    RideCompleted    
}

export type PlaceDto = {
    place_id: string;
    address: string;
    short_name: string;
    latitude: number;
    longitude: number;
};

export type DriverOfferFullDto = {
    offer_id: string;
    driver_id: string;
    ride_request_id: string;
    distance_meters: number;
    passenger_name: string;
    origin: PlaceDto;
    destination: PlaceDto;
    price: OfferPriceDto;
};

export type PostDriverStateDto = {
    status: string;
    latitude?: number;
    longitude?: number;
};

export type PostDriverPositionDto = {
    latitude: number;
    longitude: number;
};

export type DriverRideSnapshotDto = {
    ride_id: string;
    status: number;
    need_code: boolean;
};