import { 
    Box,
    IconButton,
    Stack, 
} from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp } from '@kloktunov/react-telegram-webapp';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import RouteIcon from '../../assets/icons/RouteIcon';
import { BottomSheet } from 'react-spring-bottom-sheet';
import { env } from '../../env/config';
import { useCurrentLocation } from '../rider/hooks/useCurrentLocation';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { locales } from '../../common/localization/locales';
import { apiClient } from '../../api/backend';

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

const onMapButtonClick = () => { }

export default function DriverPage() {
    const webApp = useTelegramWebApp();

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [snapPoints, setSnapPoints] = useState<number[]>([]);
    const sheetMinHeight = snapPoints?.length && snapPoints[0];
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [initialMarker, setInitialMarker] = useState<google.maps.Marker | null>(null);

    const { getCurrentLocation } = useCurrentLocation();
    const handleApiError = useApiErrorHandler();

    useEffect(() => {
        webApp?.ready();
        webApp?.expand();
        window.Telegram?.WebApp?.LocationManager?.init();
    }, [webApp]);

    useEffect(() => {
        async function createProfile() {
            await apiClient.post<void>("/api/me/driver");
        }
        createProfile();
    }, []);

    useEffect(() => {
            if (!map) return;
            let cancelled = false;
    
            (async () => {
                try {
                    const loc = await getCurrentLocation();
                    if (cancelled || !loc) return;
                    if (!window.google?.maps?.Geocoder) {
                        console.warn('Google Maps API not ready yet');
                        return;
                    }
                    setCurrentLocation(loc);
                } 
                catch (e) {
                    handleApiError(e, 'Не удалось определить стартовую точку');
                }
            })();
    
            return () => { cancelled = true; };
        }, [map, getCurrentLocation, handleApiError]);

    useEffect(() => {
        if (!map) return;
        if (currentLocation) {
            map.panTo(currentLocation);
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
    }, [map, currentLocation]);

    const onMainClick = async () => {
        webApp?.showAlert('Вы на линии');
    }

    return <Stack>
        <LoadScript
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
                        return setMap(map);
                    }}
                    options={{
                        // mapId: "8a5f0c4d3a9b1234"
                    }}
                >
            </GoogleMap>

            <Box
                sx={{
                    position: 'absolute',
                    bottom: sheetMinHeight + 20,       
                    right: 20,         
                    zIndex: 2
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
        </LoadScript>
        <BottomSheet
            open={true}
            expandOnContentDrag 
            blocking={false}
            scrollLocking={false}
            snapPoints={({ minHeight, maxHeight }) => {
                const points = [minHeight, 0.8 * maxHeight];
                queueMicrotask(() => {
                    setSnapPoints(prev => {
                        if (!prev || prev[0] !== points[0] || prev[1] !== points[1]) {
                            return points;
                        }
                        return prev;
                    });
                });
                return points;
            }}
            defaultSnap={({ minHeight }) => minHeight }>
                <></>
        </BottomSheet>
        <CustomWebAppMainButton
            disable={!currentLocation}
            text={locales.driverGoOnline}
            onClick={onMainClick} />
    </Stack>
}
