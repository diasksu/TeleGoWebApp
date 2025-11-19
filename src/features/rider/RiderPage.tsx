import { 
    Box,
    IconButton,
    Stack } from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';
import FinishIcon from '../../assets/icons/FinishIcon';
import { getPlaceFromCoords } from '../../api/googleMapsApi';
import { useNavigate } from 'react-router-dom';
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { locales } from '../../common/localization/locales';
import { toPlaceDto } from '../../common/utils/addressHelpers';
import DefiningRouteSheet from './sheets/DefiningRouteSheet';
import type { RideRequestRequest, RideRequestResponse, TariffInfo } from './types';
import RiderMap from './components/RiderMap';
import { apiClient } from '../../api/backend';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import DebugPanel from '../../common/components/DebugPanel';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { tariffService } from './services/tariffService';

export default function RiderPage() {
    const webApp = useTelegramWebApp();

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const [origin, setOrigin] = useState<google.maps.places.PlaceResult>();
    const [destination, setDestination] = useState<google.maps.places.PlaceResult>();
    const [pointsDialogOpen, setPointsDialogOpen] = useState(false);

    const [initialMarker, setInitialMarker] = useState<google.maps.Marker>();

    const [sheetMinHeight, setSheetMinHeight] = useState(0);

    const [tariffInfo, setTariffInfo] = useState<TariffInfo | null>(null);

    const navigate = useNavigate();
    

    const handleApiError = useApiErrorHandler();
    const onMainClick = async () => {
        const rideRequest: RideRequestRequest = {
            origin: toPlaceDto(origin!)!,
            destination: toPlaceDto(destination!)!
        };
        try {
            webApp?.MainButton.showProgress();
            const result = await apiClient.post<RideRequestResponse>('/api/ride-request', rideRequest);
            navigate("/waiting", { state: { rideRequestId: result.rideRequestId } });
        } catch (error) {
            handleApiError(error, 'Could not create ride request');
        } finally {
            webApp?.MainButton.hideProgress();
        }
    }

    useEffect(
        () => {
            webApp?.ready();
            webApp?.expand();
        }, 
        [webApp]
    );

    const buildRoute = async (
        originPlace: google.maps.places.PlaceResult,
        destinationPlace: google.maps.places.PlaceResult,
        directionsRenderer: google.maps.DirectionsRenderer
    ) => {
        const directionsService = new google.maps.DirectionsService();
        return new Promise<void>((resolve, reject) => {
            directionsService.route(
                {
                    origin: originPlace.geometry!.location!,
                    destination: destinationPlace.geometry!.location!,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                async (result, status) => {
                    if (status === "OK" && result) {
                        directionsRenderer.setDirections(result);
                        try {
                            const data = await tariffService.calculateTariff(originPlace, destinationPlace);
                            setTariffInfo(data);
                        } catch (error) {
                            handleApiError(error, 'Could not get tariff info');
                            setTariffInfo(null);
                        }
                        resolve();
                    } else {
                        console.error("Directions request failed:", status);
                        reject(new Error(`Directions request failed: ${status}`));
                    }
                }
            );
        });
    };

    const clearInitialMarker = () => {
        if (initialMarker) {
            initialMarker.setMap(null);
            setInitialMarker(undefined);
        }
    };

    useEffect(() => {
        if (!map || !origin?.geometry?.location || !destination?.geometry?.location) return;

        clearInitialMarker();

        const directionsRenderer = new google.maps.DirectionsRenderer({ map });

        buildRoute(origin, destination, directionsRenderer)
            .catch((error) => {
                console.error("Failed to build route:", error);
            });

        return () => {
            directionsRenderer.setMap(null);
        };
    }, [map, origin, destination, initialMarker, handleApiError]);

    const { getCurrentLocation } = useCurrentLocation();

    useEffect(() => {
        (async () => {
            const loc = await getCurrentLocation();
            if (loc && map) {
                    map.panTo(loc);
                    if (initialMarker) {
                        initialMarker.setMap(null);
                    }
                    const marker = new google.maps.Marker({ map, position: loc, label: "WE" });
                    setInitialMarker(marker);
                }
                const place = await getPlaceFromCoords(loc!);
                setOrigin(place!);
            }
        )();
    }, [map, getCurrentLocation]);

    useEffect(() => {
        const lm = window.Telegram?.WebApp?.LocationManager;
        lm?.init();
    }, [map]);

    return (

        <Stack sx={{ height: "100vh", position: "relative" }}>
            <RiderMap 
                sheetMinHeight={sheetMinHeight}
                setMap={setMap} />
            <BottomSheet
                open={true}
                expandOnContentDrag 
                blocking={false}
                snapPoints={({ minHeight, maxHeight }) => {
                    if(minHeight !== sheetMinHeight) {
                        setTimeout(() => setSheetMinHeight(minHeight), 0);
                    }
                    return [minHeight, 0.8 * maxHeight];
                }}
                defaultSnap={({ minHeight }) => minHeight }>
                <DefiningRouteSheet
                    map={map}
                    origin={origin}
                    destination={destination}
                    setOrigin={setOrigin}
                    setDestination={setDestination}
                    tariffInfo={tariffInfo}
                    pointsDialogOpen={pointsDialogOpen}
                    setPointsDialogOpen={setPointsDialogOpen} />  
            </BottomSheet>

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
                    onClick={() => console.log('Finish clicked')}
                    >
                    <FinishIcon sx={{ fontSize: 24, color: '#e3e3e3' }} />
                </IconButton>
            </Box>

            {!pointsDialogOpen && 
                <CustomWebAppMainButton
                    disable={!(origin && destination)}
                    text={locales.riderButtonCaption}
                    onClick={onMainClick} />
            }

            <DebugPanel 
                isVisible={false} />
        </Stack>
    );
}
