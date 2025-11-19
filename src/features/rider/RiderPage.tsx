import { 
    Box,
    IconButton,
    Stack } from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp } from '@kloktunov/react-telegram-webapp';
import { useCallback, useEffect, useState } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';
import FinishIcon from '../../assets/icons/FinishIcon';
import { getPlaceFromCoords } from '../../api/googleMapsApi';
import { useNavigate } from 'react-router-dom';
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { locales } from '../../common/localization/locales';
import { toPlaceDto } from '../../common/utils/addressHelpers';
import DefiningRouteSheet from './sheets/DefiningRouteSheet';
import type { RideRequestRequest, RideRequestResponse } from './types';
import RiderMap from './components/RiderMap';
import { apiClient } from '../../api/backend';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import DebugPanel from '../../common/components/DebugPanel';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useTariff } from './hooks/useTariff';

export default function RiderPage() {
    const webApp = useTelegramWebApp();

    const [origin, setOrigin] = useState<google.maps.places.PlaceResult>();
    const [destination, setDestination] = useState<google.maps.places.PlaceResult>();
    const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
    const [sheetMinHeight, setSheetMinHeight] = useState(0);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { tariffState, calculateTariff } = useTariff();

    const navigate = useNavigate();
    const handleApiError = useApiErrorHandler();

    const handleRouteRendered = useCallback((
        originPlace: google.maps.places.PlaceResult,
        destinationPlace: google.maps.places.PlaceResult
    ) => {
        (async () => {
            try {
                await calculateTariff(originPlace, destinationPlace);
            } catch (error) {
                handleApiError(error, 'Could not get tariff info');
            }
        })();
    }, [handleApiError]);
   
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

    const { getCurrentLocation } = useCurrentLocation();

    useEffect(() => {
        const initializeApp = async () => {
            webApp?.ready();
            webApp?.expand();
            const lm = window.Telegram?.WebApp?.LocationManager;
            lm?.init();

            const loc = await getCurrentLocation();
            const place = await getPlaceFromCoords(loc!);
            setOrigin(place!);
        };
        
        initializeApp();
    }, [webApp, getCurrentLocation]);

    return (

        <Stack sx={{ height: "100vh", position: "relative" }}>
            <RiderMap 
                sheetMinHeight={sheetMinHeight}
                onRouteRendered={() => handleRouteRendered(origin!, destination!)} 
                origin={origin}
                destination={destination} 
                setMainMap={setMap}/>
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
                    tariffState={tariffState}
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
