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
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { locales } from '../../common/localization/locales';
import { toPlaceDto } from '../../common/utils/addressHelpers';
import DefiningRouteSheet from './sheets/DefiningRouteSheet';
import { RiderFlowStep, type RideRequestRequest, type RideRequestResponse } from './types';
import RiderMap from './components/RiderMap';
import { apiClient } from '../../api/backend';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import DebugPanel from '../../common/components/DebugPanel';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useTariff } from './hooks/useTariff';
import WaitingForDriverSheet from './sheets/WaitingForDriverSheet';

export default function RiderPage() {
    const webApp = useTelegramWebApp();

    const [origin, setOrigin] = useState<google.maps.places.PlaceResult>();
    const [destination, setDestination] = useState<google.maps.places.PlaceResult>();
    const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
    const [sheetMinHeight, setSheetMinHeight] = useState(0);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { tariffState, calculateTariff } = useTariff();
    const [flowStep, setFlowStep] = useState(RiderFlowStep.DefiningRoute);

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

    const mainButtonCaption = () => {
        if(flowStep == RiderFlowStep.DefiningRoute) {
            return locales.riderButtonCaption;
        } else if(flowStep == RiderFlowStep.WaitingForDriver) {
            return locales.cancelRide;
        }
    }
   
    const onMainClick = async () => {
        if(flowStep == RiderFlowStep.DefiningRoute) {
            const rideRequest: RideRequestRequest = {
                origin: toPlaceDto(origin!)!,
                destination: toPlaceDto(destination!)!
            };
            try {
                webApp?.MainButton.showProgress();
                setFlowStep(RiderFlowStep.WaitingForDriver);
                return;
                await apiClient.post<RideRequestResponse>('/api/ride-request', rideRequest);
            } catch (error) {
                handleApiError(error, 'Could not create ride request');
            } finally {
                webApp?.MainButton.hideProgress();
            }
        }
        else if(flowStep == RiderFlowStep.WaitingForDriver) {
            webApp?.showAlert('Ride cancelled');
            setFlowStep(RiderFlowStep.DefiningRoute);
        }
    }

    const { getCurrentLocation } = useCurrentLocation();

    useEffect(() => {
        webApp?.ready();
        webApp?.expand();
        window.Telegram?.WebApp?.LocationManager?.init();
    }, [webApp]);

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

                const place = await getPlaceFromCoords(loc);
                if (!cancelled && place) setOrigin(place);
            } 
            catch (e) {
                handleApiError(e, 'Не удалось определить стартовую точку');
            }
        })();

        return () => { cancelled = true; };
    }, [map, getCurrentLocation, handleApiError]);

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
                {flowStep == RiderFlowStep.DefiningRoute && <DefiningRouteSheet
                    map={map}
                    origin={origin}
                    destination={destination}
                    setOrigin={setOrigin}
                    setDestination={setDestination}
                    tariffState={tariffState}
                    pointsDialogOpen={pointsDialogOpen}
                    setPointsDialogOpen={setPointsDialogOpen} />}
                {flowStep == RiderFlowStep.WaitingForDriver && <WaitingForDriverSheet 
                    some="" />}
            </BottomSheet>
            

            {!pointsDialogOpen && 
                <CustomWebAppMainButton
                    disable={!(origin && destination)}
                    text={mainButtonCaption()}
                    onClick={onMainClick} />
            }

            <DebugPanel 
                isVisible={false} />
        </Stack>
    );
}
