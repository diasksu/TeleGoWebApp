import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { env } from '../../../env/config';
import { useEffect, useState, useRef } from "react";
import { Box, IconButton } from "@mui/material";
import RouteIcon from "../../../assets/icons/RouteIcon";
import { RiderFlowStep } from "../types";
import HailingIcon from "../../../assets/icons/HailingIcon";

interface RiderMapProps {
    readonly origin?: google.maps.places.PlaceResult;
    readonly destination?: google.maps.places.PlaceResult;
    readonly driverPosition: google.maps.LatLngLiteral | null;
    readonly onRouteRendered?: (
        origin: google.maps.places.PlaceResult,
        destination: google.maps.places.PlaceResult
    ) => void
    readonly setMainMap?: (map: google.maps.Map) => void;
    readonly flowStep: RiderFlowStep;
}

const libraries: ("places" | "marker" | "geometry")[] = ["places", "marker", "geometry"];

// const mapStyle: google.maps.MapTypeStyle[] = [
//     { elementType: 'geometry', stylers: [{ color: '#212121' }] },
//     { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
//     { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
//     { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#484848' }] },
//     { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f252e' }] },
// ];

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

export default function RiderMap({
    onRouteRendered,
    origin,
    destination,
    driverPosition,
    setMainMap,
    flowStep
}: RiderMapProps) {

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [initialMarker, setInitialMarker] = useState<google.maps.Marker | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const driverMarkerRef = useRef<google.maps.Marker | null>(null);

    useEffect(() => {
        if (!map) return;
        if (!origin?.geometry?.location) return;
        if (destination?.geometry?.location) {
            // if destination defined — no need in initial marker
            if (initialMarker) {
                initialMarker.setMap(null);
                setInitialMarker(null);
            }
            return;
        }
        const loc = origin.geometry.location;
        map.panTo(loc);
        if (!initialMarker) {
            const marker = new google.maps.Marker({ map, position: loc, label: 'I' });
            setInitialMarker(marker);
        } else {
            initialMarker.setPosition(loc);
        }
    }, [map, origin, destination]);

    useEffect(() => {
        if (!map) return;
        if (!driverPosition) return;
        if (flowStep !== RiderFlowStep.DriverEnRoute) return;
        if (!driverMarkerRef.current) {
            driverMarkerRef.current = new google.maps.Marker({
                map,
                position: driverPosition,
                label: 'D',
            });
            if (!origin?.geometry?.location) return;
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin!.geometry!.location!);
            bounds.extend(driverPosition);
            map.fitBounds(bounds, {
                top: 80,
                bottom: 80,
                left: 60,
                right: 60,
            });
        } else {
            driverMarkerRef.current.setPosition(driverPosition);
        }
    }, [map, driverPosition, flowStep, origin]);

    useEffect(() => {
        if (!map) return;
        if (!origin?.geometry?.location || !destination?.geometry?.location) return;

        // Убираем стартовый маркер (если был)
        if (initialMarker) {
            initialMarker.setMap(null);
            setInitialMarker(null);
        }

        // Чистим предыдущий renderer
        if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
            directionsRendererRef.current = null;
        }

        const renderer = new google.maps.DirectionsRenderer({ map });
        directionsRendererRef.current = renderer;

        const svc = new google.maps.DirectionsService();
        svc.route(
            {
                origin: origin.geometry.location,
                destination: destination.geometry.location,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    renderer.setDirections(result);
                    onRouteRendered?.(origin, destination);
                } else {
                    console.error('Directions request failed:', status);
                }
            }
        );
        return () => renderer.setMap(null);
    }, [map, origin, destination]); // Important! without onRouteRendered

    const onMapButtonClick = () => { 
        if (!map || !origin) return;

        switch (flowStep) {
            case RiderFlowStep.DefiningRoute: {
                if (!destination) return;
                const directions = directionsRendererRef.current?.getDirections();
                const bounds = directions?.routes?.[0]?.bounds;
                if (bounds) map.fitBounds(bounds);
                break;
            }

            case RiderFlowStep.WaitingForDriver: {
                const loc = origin.geometry?.location;
                if (loc) {
                    map.panTo(loc);
                    map.setZoom(16);
                }
                break;
            }

            default:
                break;
        }
    }

    useEffect(() => {
        onMapButtonClick();
    }, [flowStep]);

    return <LoadScript
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
                            {flowStep === RiderFlowStep.DefiningRoute && (
                                <RouteIcon sx={{ fontSize: 24, color: '#e3e3e3' }} />
                            )}

                            {flowStep === RiderFlowStep.WaitingForDriver && (
                                <HailingIcon sx={{ fontSize: 24, color: '#e3e3e3' }} />
                            )}
                        </IconButton>
                    </Box>
                </GoogleMap>
            </LoadScript>;
}