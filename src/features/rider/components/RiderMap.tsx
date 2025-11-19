import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { env } from '../../../env/config';
import { useEffect, useState, useRef } from "react";

interface RiderMapProps {
    sheetMinHeight: number; 
    origin?: google.maps.places.PlaceResult;
    destination?: google.maps.places.PlaceResult;
    onRouteRendered?: (
        origin: google.maps.places.PlaceResult,
        destination: google.maps.places.PlaceResult
    ) => void
    setMainMap?: (map: google.maps.Map) => void;
}

const libraries: ("places" | "marker")[] = ["places", "marker"];

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
    sheetMinHeight,
    onRouteRendered,
    origin,
    destination,
    setMainMap
}: RiderMapProps) {

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [initialMarker, setInitialMarker] = useState<google.maps.Marker | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

   useEffect(() => {
        if (!map) return;
        if (!origin?.geometry?.location) return;
        if (destination?.geometry?.location) {
            // есть destination — маркер не нужен
            if (initialMarker) {
                initialMarker.setMap(null);
                setInitialMarker(null);
            }
            return;
        }

        const loc = origin.geometry.location;
        map.panTo(loc);

        if (!initialMarker) {
            const marker = new google.maps.Marker({ map, position: loc, label: 'WE' });
            setInitialMarker(marker);
        } else {
            initialMarker.setPosition(loc);
        }
    }, [map, origin, destination]);

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
    }, [map, origin, destination]); // ВАЖНО: без onRouteRendered

    return <LoadScript
                googleMapsApiKey={env.googleMapsApiKey}
                libraries={libraries}>
                <GoogleMap
                        mapContainerStyle={{ 
                            width: "100%", 
                            height: `calc(100vh - ${sheetMinHeight}px + 16px)`
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
                </GoogleMap>
            </LoadScript>;
}