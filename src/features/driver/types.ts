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
};