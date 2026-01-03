import { Stack } from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp, WebAppMainButton } from '@kloktunov/react-telegram-webapp';
import { useCallback, useEffect, useState } from 'react';
import { getPlaceFromCoords } from '../../api/googleMapsApi';
import { locales } from '../../common/localization/locales';
import { toPlaceDto } from '../../common/utils/addressHelpers';
import DefiningRouteSheet from './sheets/DefiningRouteSheet';
import { RiderFlowStep, type PassengerActiveRideProjection, type PassengerRideSnapshotDto, type RideRequestRequest, type RideRequestResponse } from './types';
import RiderMap from './components/RiderMap';
import { apiClient } from '../../api/backend';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import DebugPanel from '../../common/components/DebugPanel';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useTariff } from './hooks/useTariff';
import WaitingForDriverSheet from './sheets/WaitingForDriverSheet';
import { useFakeDrivers } from './hooks/useFakeDrivers';
import DriverEnRouteSheet from './sheets/DriverEnRouteSheet';
import { useActiveRidePolling } from './hooks/useActiveRidePolling';
import { useRideSnapshotPolling } from './hooks/useRideSnapshotPolling';
import DriverArrivedSheet from './sheets/DriverArrivedSheet';
import RideInProgressSheet from './sheets/RideInProgressSheet';

export default function RiderPage() {
    const webApp = useTelegramWebApp();

    const [origin, setOrigin] = useState<google.maps.places.PlaceResult>();
    const [destination, setDestination] = useState<google.maps.places.PlaceResult>();
    const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [flowStep, setFlowStep] = useState(RiderFlowStep.DefiningRoute);
    const [adjustment, setAdjustment] = useState<number>(0);
    const [activeRide, setActiveRide] = useState<PassengerActiveRideProjection | null>(null);
    const [rideSnapshot, setRideSnapshot] = useState<PassengerRideSnapshotDto | null>(null);
    const [driverPosition, setDriverPosition] = useState<google.maps.LatLngLiteral | null>(null);

    const { tariffState, calculateTariff } = useTariff();

    const handleApiError = useApiErrorHandler();

    useFakeDrivers(
        flowStep === RiderFlowStep.WaitingForDriver, 
        {
            maxCars: 2,
            fadeInMs: 1000,
            fadeOutMs: 1000,
            minSpeedKmh: 20,
            maxSpeedKmh: 60,
            minLifeMs: 4000,
            maxLifeMs: 9000,
            spawnIntervalMs: 4000,
            routeRadiusMeters: 300
        },
        origin?.geometry?.location, 
        map);

    useActiveRidePolling(flowStep, setFlowStep, setActiveRide);

    useRideSnapshotPolling(flowStep, setFlowStep, setRideSnapshot);

    useEffect(() => {
        if(!activeRide && !rideSnapshot) {
            return;
        }
        if(!rideSnapshot) {
            const pos = {
                lat: activeRide!.driver_state.last_latitude,
                lng: activeRide!.driver_state.last_longitude
            };
            setDriverPosition(pos);
            return;
        }
        const pos = {
            lat: rideSnapshot.driver_state.last_latitude,
            lng: rideSnapshot.driver_state.last_longitude
        };
        setDriverPosition(pos);
    }, [activeRide, rideSnapshot]);

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
                destination: toPlaceDto(destination!)!,
                quote_id: tariffState.data?.quote_id,
                adjustment: adjustment
            };
            try {
                webApp?.MainButton.showProgress();
                setFlowStep(RiderFlowStep.WaitingForDriver);
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
        async function createProfile() {
            await apiClient.post<void>("/api/me/passenger");
        }
        createProfile();
    }, []);

    useEffect(() => {
        setAdjustment!(0);
    }, [tariffState, setAdjustment]);

    useEffect(() => {
        if (!map) return;
        let cancelled = false;
        (async () => {
            const loc = await getCurrentLocation();
            if (!loc || cancelled) return;
            const place = await getPlaceFromCoords(loc);
            if (!cancelled && place) {
                setOrigin(place);
            }
        })();
        return () => { cancelled = true; };
    }, [map, getCurrentLocation]);

    return (
        <Stack sx={{ height: "100vh", position: "relative" }}>
            <RiderMap 
                onRouteRendered={() => handleRouteRendered(origin!, destination!)} 
                origin={origin}
                destination={destination} 
                driverPosition={driverPosition}
                setMainMap={setMap}
                flowStep={flowStep} />
            <Stack
                sx={{
                    borderTopLeftRadius: '15px',
                    borderTopRightRadius: '15px',
                    marginTop: '-15px',
                    backgroundColor: "var(--tg-theme-bg-color)",
                    zIndex: 2,
                }}>
                {flowStep == RiderFlowStep.DefiningRoute && <DefiningRouteSheet
                    map={map}
                    origin={origin}
                    destination={destination}
                    setOrigin={setOrigin}
                    setDestination={setDestination}
                    adjustment={adjustment!}
                    setAdjustment={setAdjustment}
                    tariffState={tariffState}
                    pointsDialogOpen={pointsDialogOpen}
                    setPointsDialogOpen={setPointsDialogOpen} />}
                {flowStep == RiderFlowStep.WaitingForDriver && <WaitingForDriverSheet 
                    origin={origin}
                    destination={destination} />}
                {flowStep == RiderFlowStep.DriverEnRoute && activeRide && (
                    <DriverEnRouteSheet ride={activeRide} />
                )}
                {flowStep == RiderFlowStep.DriverArrived && rideSnapshot?.ride_code && (
                    <DriverArrivedSheet rideCode={rideSnapshot?.ride_code} />
                )}
                {flowStep == RiderFlowStep.RideInProgress && activeRide && (
                    <RideInProgressSheet ride={activeRide} />
                )}
            </Stack>
            {!pointsDialogOpen && 
                <WebAppMainButton
                    disable={!(origin && destination)}
                    text={mainButtonCaption()}
                    onClick={onMainClick} />
            }
            <DebugPanel 
                isVisible={false}
                />
        </Stack>
    );
}