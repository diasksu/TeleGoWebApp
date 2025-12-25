import { 
    LinearProgress,
    Stack,
    Typography, 
} from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp, WebAppMainButton } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState } from 'react';
import { useCurrentLocation } from '../rider/hooks/useCurrentLocation';
import { useApiErrorHandler } from '../../common/hooks/useApiErrorHandler';
import { locales } from '../../common/localization/locales';
import { apiClient } from '../../api/backend';
import { useTracking } from '../../common/hooks/useTracking';
import { 
    DriverFlowStep,
    type DriverOfferFullDto,
    type DriverRideSnapshotDto,
    type PostDriverPositionDto,
    type PostDriverStateDto
} from './types';
import { useInterval } from '../../common/hooks/useInterval';
import DebugPanel from '../../common/components/DebugPanel';
import { RideStatus } from '../rider/types';
import OrderPreviewSheet from './sheets/OrderPreviewSheet';
import GoingToPickupSheet from './sheets/GoingToPickupSheet';
import ArrivedAtPickupSheet from './sheets/ArrivedAtPickupSheet';
import RideInProgressSheet from './sheets/RideInProgressSheet';
import RideCompletedSheet from './sheets/RideCompletedSheet';
import DriverMap from './components/DriverMap';

export default function DriverPage() {
    const webApp = useTelegramWebApp();

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [offer, setOffer] = useState<DriverOfferFullDto | null>(null);
    const [rideId, setRideId] = useState<string | null>(null);
    const [pickupCode, setPickupCode] = useState(Number);

    const { getCurrentLocation } = useCurrentLocation();
    const { position, startTracking, stopTracking } = useTracking();
    const handleApiError = useApiErrorHandler();
    const [flowStep, setFlowStep] = useState(DriverFlowStep.Offline);

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
        if (!position) return;
        updateDriverPosition(position);
    }, [position]);

    useInterval(() => {
        if (!position) return;
        postDriverPosition(position);
    }, 3000);

    const onMainClick = async () => {
        switch(flowStep) {
            case DriverFlowStep.Offline:
                await goOnline();
                break;
            case DriverFlowStep.Online:
                await goOffline();
                break;
            case DriverFlowStep.ArrivedAtPickup: {
                try {
                    await apiClient.post("/api/me/driver/ride/start", {
                        ride_id: rideId,
                        ride_code: pickupCode
                    });
                    // success → переход на InProgress
                    setFlowStep(DriverFlowStep.RideInProgress);
                } catch (e: unknown) {
                    if (e instanceof Error && e.message.includes("409")) {
                        webApp?.showAlert("Неверный код посадки");
                        return;
                    }
                    webApp?.showAlert("Ошибка. Попробуйте ещё раз");
                }
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

    const webAppAlert = (message: string) => {
        webApp?.showAlert(message);
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
        const snapshot = await apiClient.post<DriverRideSnapshotDto>("/api/me/driver/position", payload);
        if (snapshot.status == RideStatus.Arrived) {
            if (flowStep === DriverFlowStep.GoingToPickup) {
                setTimeout(() => {
                    window.dispatchEvent(new Event("geosim:stop"));
                }, 3000);
                setFlowStep(DriverFlowStep.ArrivedAtPickup);
            }
        }
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

    const mainButtonDisabled = () => {
        if(flowStep === DriverFlowStep.ArrivedAtPickup) {
            return pickupCode?.toString().length !== 4;
        }
        return !currentLocation;
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
            const rideId = await apiClient.post<string | null>(
                `/api/me/driver/offers/${offer?.offer_id}/accept`
            );
            if(rideId) {
                setRideId(rideId);
                setFlowStep(DriverFlowStep.GoingToPickup);     
            }       
        }
        catch (e) {
            handleApiError(e, 'Не удалось принять заказ');
        }
    }

    const originLocation = offer ? {
        lat: offer.origin.latitude,
        lng: offer.origin.longitude
    } : null;

    const destinationLocation = offer ? {
        lat: offer.destination.latitude,
        lng: offer.destination.longitude
    } : null;
 
    return <Stack sx={{ height: "100vh", position: "relative" }}>
        <DriverMap
            setMainMap={setMap}
            flowStep={flowStep}
            currentLocation={currentLocation}
            originLocation={originLocation}
            destinationLocation={destinationLocation}
        />
        <Stack
            sx={{
                borderTopLeftRadius: '15px',
                borderTopRightRadius: '15px',
                marginTop: '-15px',
                backgroundColor: "var(--tg-theme-bg-color)",
                zIndex: 0,
            }}>
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
            {flowStep == DriverFlowStep.OrderPreview && offer && (
                <OrderPreviewSheet offer={offer} acceptOffer={acceptOffer} declineOffer={declineOffer} />
            )}
            {flowStep == DriverFlowStep.GoingToPickup && (
                <GoingToPickupSheet />
            )}
            {flowStep == DriverFlowStep.ArrivedAtPickup && offer && (
                <ArrivedAtPickupSheet 
                    offer={offer}
                    setPickupCode={setPickupCode}
                    webAppAlert={webAppAlert} />
            )}
            {flowStep == DriverFlowStep.RideInProgress && offer && (
                <RideInProgressSheet offer={offer} />
            )}
            {flowStep == DriverFlowStep.RideCompleted && (
                <RideCompletedSheet goOffline={goOffline} />
            )}
        </Stack>
        {flowStep != DriverFlowStep.OrderPreview && 
         flowStep != DriverFlowStep.GoingToPickup &&
            <WebAppMainButton
                disable={mainButtonDisabled()}
                text={mainButtonCaption()}
                onClick={onMainClick} 
            />}
        <DebugPanel 
            isVisible={false}
            debug={window.debugInfo}
        />
    </Stack>
}
