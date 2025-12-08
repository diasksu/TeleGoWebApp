import { 
    Box,
    Button,
    IconButton,
    LinearProgress,
    Stack,
    Typography, 
} from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp } from '@kloktunov/react-telegram-webapp';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { useEffect, useRef, useState } from 'react';
import RouteIcon from '../../assets/icons/RouteIcon';
import { BottomSheet } from 'react-spring-bottom-sheet';
import { env } from '../../env/config';
import { useCurrentLocation } from '../rider/hooks/useCurrentLocation';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { locales } from '../../common/localization/locales';
import { apiClient } from '../../api/backend';
import { useTracking } from '../../common/hooks/useTracking';
import { DriverFlowStep, type DriverOfferFullDto, type PostDriverPositionDto, type PostDriverStateDto } from './types';
import { useInterval } from '../../common/hooks/useInterval';

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
    const [offer, setOffer] = useState<DriverOfferFullDto | null>(null);
    const rideRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const pickupRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    const { getCurrentLocation } = useCurrentLocation();
    const { position, startTracking, stopTracking } = useTracking();
    const handleApiError = useApiErrorHandler();
    const [flowStep, setFlowStep] = useState(DriverFlowStep.Offline);

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
        if (flowStep !== DriverFlowStep.GoingToPickup) {
            if (pickupRendererRef.current) {
                pickupRendererRef.current.setMap(null);
                pickupRendererRef.current = null;
            }
            return;
        } 
        if (!offer) return;
        if (!map) return;
        if (!currentLocation) return;
        const destination = {
            lat: offer.origin.latitude,
            lng: offer.origin.longitude
        };
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
                destination,
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

    useEffect(() => {
        if (flowStep !== DriverFlowStep.Online) return;
        let cancelled = false;
        const interval = setInterval(async () => {
            try {
                const data = await apiClient.get<DriverOfferFullDto>(
                    "/api/me/driver/offers"
                );
                if (!cancelled && data) {
                    setOffer(data);
                    setFlowStep(DriverFlowStep.OrderPreview);
                }
            } catch (e) {
                console.warn("Offer polling error", e);
            }
        }, 3000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [flowStep]);

    useEffect(() => {
        if (!offer) return;
        if (!map) return;
        const origin = {
            lat: offer.origin.latitude,
            lng: offer.origin.longitude
        };
        const destination = {
            lat: offer.destination.latitude,
            lng: offer.destination.longitude
        };
        if (rideRendererRef.current) {
            rideRendererRef.current.setMap(null);
            rideRendererRef.current = null;
        }
        const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true });
        rideRendererRef.current = renderer;
        const svc = new google.maps.DirectionsService();
        svc.route(
            {
                origin,
                destination,
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
    }, [offer, map])

    useEffect(() => {
        if (!position) return;
        updateDriverPosition(position);
    }, [position]);

    useInterval(() => {
        if (!position) return;
        postDriverPosition(position);
    }, 15000);

    const onMainClick = async () => {
        switch(flowStep) {
            case DriverFlowStep.Offline:
                await goOnline();
                break;
            case DriverFlowStep.Online:
                await goOffline();
                break;
            case DriverFlowStep.ArrivedAtPickup: {
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
                setFlowStep(DriverFlowStep.RideInProgress);
                break;
            }
            case DriverFlowStep.RideInProgress:
                window.dispatchEvent(new Event("geosim:stop"));
                setFlowStep(DriverFlowStep.RideCompleted);
                break;
            case DriverFlowStep.RideCompleted:
                await goOnline();
                break;
        }
    }

    const goOnline = async () => {
        const loc = await getCurrentLocation();
        if(!loc) {
            webApp?.showAlert('Could not get current location');
            return;
        }
        await postDriverState("ONLINE_ACTIVE", loc);
        startTracking(loc); 
        setFlowStep(DriverFlowStep.Online);
    }

    const updateDriverPosition = async (pos: google.maps.LatLngLiteral) => {
        setCurrentLocation(pos);
        if(flowStep == DriverFlowStep.GoingToPickup && offer) {
            const originLat = offer.origin.latitude;
            const originLng = offer.origin.longitude;
            const driverLat = pos.lat;
            const driverLng = pos.lng;  
            const dist = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(driverLat, driverLng),
                new google.maps.LatLng(originLat, originLng)
            );
            if(dist < 50) {
                setFlowStep(DriverFlowStep.ArrivedAtPickup);
                setTimeout(() => {
                    window.dispatchEvent(new Event("geosim:stop"));
                }, 3000);
            }
        }
    };

    const postDriverState = async (status: string, pos?: google.maps.LatLngLiteral) => {
        const payload : PostDriverStateDto = {
            status: status
        };
        if (pos) {
            payload.latitude = pos.lat;
            payload.longitude = pos.lng;
        }
        await apiClient.post("/api/me/driver/state", payload);
    };

    const postDriverPosition = async (pos: google.maps.LatLngLiteral) => {
        const payload : PostDriverPositionDto = {
            latitude: pos.lat,
            longitude: pos.lng
        };
        await apiClient.post("/api/me/driver/position", payload);
    };

    const goOffline = () => {
        stopTracking();
        postDriverState("OFFLINE");
        setFlowStep(DriverFlowStep.Offline);
    };

    const mainButtonCaption = () => {
        switch(flowStep) {
            case DriverFlowStep.Offline:
                return locales.driverGoOnline;
            case DriverFlowStep.Online:
                return locales.driverGoOffline;
            case DriverFlowStep.OrderPreview:
                return locales.driverAccept
            case DriverFlowStep.ArrivedAtPickup:
                return locales.driverStartRide;
            case DriverFlowStep.RideInProgress:
                return locales.driverEndRide;
            case DriverFlowStep.RideCompleted:
                return locales.driverGoOnline;
        }
    }
    
    const declineOffer = async () => {
        await apiClient.post(
            `/api/me/driver/offers/${offer?.offer_id}/decline`
        );
        setOffer(null);
        setFlowStep(DriverFlowStep.Online);
    }

    const acceptOffer = async () => {
        try {
            await apiClient.post<string | null>(
                `/api/me/driver/offers/${offer?.offer_id}/accept`
            );
            setFlowStep(DriverFlowStep.GoingToPickup);            
        }
        catch (e) {
            handleApiError(e, 'Не удалось принять заказ');
        }
    }

    const formattedPrice = offer?.price.currency_symbol_position === 'before' ? 
        `${offer?.price.currency_symbol}${offer?.price.amount}` : 
        `${offer?.price.amount}${offer?.price.currency_symbol}`;
 
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
            {flowStep == DriverFlowStep.Online && <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    Waiting for a ride...
                </Typography>
                <LinearProgress
                    sx={{
                        '& .MuiLinearProgress-bar': {
                            animationDuration: '4s', // по умолчанию ~2s
                        },
                    }} />
            </Stack>}
            {flowStep == DriverFlowStep.OrderPreview && <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    You have a new ride offer!
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography>
                        Passenger: {offer?.passenger_name}
                    </Typography>
                    <Typography>
                        Distance to pickup: {(offer?.distance_meters ?? 0) / 1000} km
                    </Typography>
                    <Typography>
                        From: {offer?.origin.short_name}
                    </Typography>
                    <Typography>
                        To: {offer?.destination.short_name}
                    </Typography>
                    <Typography>
                        Price: {formattedPrice}
                    </Typography>
                </Stack>
                <Stack 
                    direction="row"
                    spacing={1}
                    sx={{ 
                        width: "100%", 
                        padding: '10px'
                    }}>
                    <Button sx={{ 
                            flex: 1,
                            backgroundColor: "var(--tg-theme-button-color)",
                            color: "var(--tg-theme-button-text-color)",
                            "&:hover": {
                                opacity: 0.92
                            }
                        }}
                        onClick={acceptOffer}>
                        Принять
                    </Button>
                    <Button sx={{ 
                            flex: 1,
                            backgroundColor: "var(--tg-theme-secondary-bg-color)",
                            color: "var(--tg-theme-destructive-text-color)",
                            "&:hover": {
                                opacity: 0.92
                            }
                        }}
                        onClick={declineOffer}>
                        Отклонить
                    </Button>
                </Stack>
            </Stack>}
            {flowStep == DriverFlowStep.GoingToPickup && <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    Heading to pickup location...
                </Typography>
            </Stack>}
            {flowStep == DriverFlowStep.ArrivedAtPickup && <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    You have arrived at the pickup location.
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography>
                        Passenger: {offer?.passenger_name}
                    </Typography>
                    <Typography>
                        From: {offer?.origin.short_name}
                    </Typography>
                    <Typography>
                        To: {offer?.destination.short_name}
                    </Typography>
                     <Stack spacing={1} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Если по какой-то причине вы не смогли связаться с пассажиром,
                        вы можете отменить поездку.
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            textDecoration: 'underline',
                            color: '#3876F0',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                        onClick={() => {webApp?.showAlert("Поездка отменена")}} 
                    >
                        Отменить поездку
                    </Typography>
                </Stack>
                </Stack>
            </Stack>}
            {flowStep == DriverFlowStep.RideInProgress && <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    Ride in progress...
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography>
                        Passenger: {offer?.passenger_name}
                    </Typography>
                    <Typography>
                        From: {offer?.origin.short_name}
                    </Typography>
                    <Typography>
                        To: {offer?.destination.short_name}
                    </Typography>
                </Stack>
            </Stack>}
            {flowStep == DriverFlowStep.RideCompleted && <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    You have completed the ride.
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography variant="body2" color="text.secondary">
                        Если вы хотите, можете остаться в оффлайн.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            textDecoration: 'underline',
                            color: '#3876F0',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                        onClick={goOffline} 
                    >
                        Оставаться в оффлайн
                    </Typography>
                </Stack>
            </Stack>}
        </BottomSheet>
        {flowStep != DriverFlowStep.OrderPreview && 
         flowStep != DriverFlowStep.GoingToPickup &&
            <CustomWebAppMainButton
                disable={!currentLocation}
                text={mainButtonCaption()}
                onClick={onMainClick} />}
    </Stack>
}
