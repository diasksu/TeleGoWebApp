import { Box, IconButton } from "@mui/material";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { env } from '../../../env/config';
import RouteIcon from "../../../assets/icons/RouteIcon";
import { useEffect, useRef, useState } from "react";
import { DriverFlowStep } from "../types";

interface DriverMapProps {
    readonly setMainMap?: (map: google.maps.Map) => void;
    readonly flowStep: DriverFlowStep;
    readonly currentLocation: google.maps.LatLngLiteral | null;
    readonly originLocation: google.maps.LatLngLiteral | null;
    readonly destinationLocation: google.maps.LatLngLiteral | null;
}

const libraries: ("places" | "marker")[] = ["places", "marker"];

const mapStyle: google.maps.MapTypeStyle[] = [
    {"featureType": "administrative", "elementType": "labels", "stylers": [{"color": "#FFFFFF"}, {"visibility": "simplified"}]},
    {"featureType": "landscape.man_made", "elementType": "all", "stylers": [{"visibility": "simplified"}, {"color": "#303030"}]},
    {"featureType": "landscape.natural", "elementType": "geometry", "stylers": [{"color": "#000000"}, {"visibility": "simplified"}]},
    {"featureType": "poi", "elementType": "geometry", "stylers": [{"visibility": "off"}]},
    {"featureType": "poi", "elementType": "labels.text", "stylers": [{"visibility": "simplified"}, {"color": "#FFFFFF"}]},
    {"featureType": "road", "elementType": "geometry", "stylers": [{"visibility": "simplified"}, {"color": "#808080"}]},
    {"featureType": "road", "elementType": "labels.text", "stylers": [{"color": "#FFFFFF"}, {"visibility": "simplified"}]},
    {"featureType": "road", "elementType": "labels.icon", "stylers": [{"visibility": "off"}]},
    {"featureType": "water", "elementType": "all", "stylers": [{"color": "#303030"}]}
];

export default function DriverMap({ 
    setMainMap,
    flowStep,
    currentLocation,
    originLocation,
    destinationLocation
}: DriverMapProps) 
{
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [initialMarker, setInitialMarker] = useState<google.maps.Marker | null>(null);

    const rideRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const pickupRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!map) return;
        if (currentLocation) {
            if(flowStep == DriverFlowStep.Online || 
                flowStep == DriverFlowStep.Offline || 
                flowStep == DriverFlowStep.GoingToPickup || 
                flowStep == DriverFlowStep.RideInProgress) {
                map.panTo(currentLocation);
                map.setZoom(16);
            }
            if (!initialMarker) {
                const marker = new google.maps.Marker({ map, position: currentLocation, label: 'ME' });
                setInitialMarker(marker);
            } else {
                initialMarker.setPosition(currentLocation);
            }
        }
        else {
            if (initialMarker) {
                initialMarker.setMap(null);
                setInitialMarker(null);
            }
        }
    }, [map, currentLocation, flowStep]);

    useEffect(() => {
        if (!originLocation || !destinationLocation) return;
        if (!map) return;
        if (rideRendererRef.current) {
            rideRendererRef.current.setMap(null);
            rideRendererRef.current = null;
        }
        const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true });
        rideRendererRef.current = renderer;
        const svc = new google.maps.DirectionsService();
        svc.route(
            {
                origin: originLocation,
                destination: destinationLocation,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    renderer.setDirections(result);
                } else {
                    console.error('Directions request failed:', status);
                }
            }
        );
        return () => renderer.setMap(null);
    }, [originLocation, destinationLocation, map])

    useEffect(() => {
        if (flowStep === DriverFlowStep.ArrivedAtPickup) {
            const result = rideRendererRef.current?.getDirections();
            const latlngs = result?.routes[0].overview_path.map(p => ({
                latitude: p.lat(),
                longitude: p.lng()
            }));
            window.dispatchEvent(new CustomEvent("geosim:setRoute", {
                detail: { route: latlngs }
            }));
            setTimeout(() => {
                window.dispatchEvent(new Event("geosim:start"));
            }, 3000);
        }
        if (flowStep !== DriverFlowStep.GoingToPickup) {
            if (pickupRendererRef.current) {
                pickupRendererRef.current.setMap(null);
                pickupRendererRef.current = null;
            }
            return;
        }
        if (!originLocation) return;
        if (!map) return;
        if (!currentLocation) return;
        if (pickupRendererRef.current) {
            pickupRendererRef.current.setMap(null);
            pickupRendererRef.current = null;
        }
        const renderer = new google.maps.DirectionsRenderer({ 
                map, 
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: "#00C853",    
                    strokeWeight: 6,   
                    strokeOpacity: 0.5               
                }
            });
        pickupRendererRef.current = renderer;
        const svc = new google.maps.DirectionsService();
        svc.route(
            {
                origin: currentLocation,
                destination: originLocation,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    const latlngs = result.routes[0].overview_path.map(p => ({
                        latitude: p.lat(),
                        longitude: p.lng()
                    }));
                    window.dispatchEvent(new CustomEvent("geosim:setRoute", {
                        detail: { route: latlngs }
                    }));
                    setTimeout(() => {
                        window.dispatchEvent(new Event("geosim:start"));
                    }, 3000);
                    renderer.setDirections(result);
                } else {
                    console.error('Directions request failed:', status);
                }
            }
        );
        return () => renderer.setMap(null);
    }, [flowStep]);

    const onMapButtonClick = () => { }

    return  <LoadScript
                googleMapsApiKey={env.googleMapsApiKey}
                libraries={libraries}>
                <GoogleMap
                        mapContainerStyle={{ 
                            width: "100%", 
                            height: "100vh"
                        }}
                        zoom={13}
                        onLoad={(map) => {
                            map.setOptions({
                                styles: mapStyle,
                                disableDefaultUI: true,
                                mapTypeControl: false,
                            });
                            setMainMap?.(map);
                            return setMap(map);
                        }}
                        options={{
                            // mapId: "8a5f0c4d3a9b1234"
                        }}
                    >
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '30px',
                            right: '15px'
                        }}
                    >
                        <IconButton
                            sx={{
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                width: 40,
                                height: 40,
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
                            }}
                            onClick={onMapButtonClick}
                        >
                            <RouteIcon sx={{ fontSize: 24, color: '#e3e3e3' }} />
                        </IconButton>
                    </Box>   
                </GoogleMap>
            </LoadScript>;
}