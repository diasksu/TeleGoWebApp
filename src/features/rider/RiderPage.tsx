import { 
    Box,
    Divider,
    IconButton,
    Stack,
    Typography,
    useTheme } from '@mui/material';
import '../../assets/css/takeme.css';
import { useTelegramWebApp, WebAppBackButton } from '@kloktunov/react-telegram-webapp';
import { useEffect, useState, useRef } from 'react';
import { GoogleMap, LoadScript  } from "@react-google-maps/api";
import { BottomSheet, type BottomSheetRef } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';
import type { SpringEvent } from 'react-spring-bottom-sheet/dist/types';
import HailingIcon from '../../assets/icons/HailingIcon';
import FinishIcon from '../../assets/icons/FinishIcon';
import { TeleGoPointsDrawer } from '../../common/components/TeleGoPointsDrawer';
import { getPlaceFromCoords } from '../../api/googleMapsApi';
import { useNavigate } from 'react-router-dom';
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { locales } from '../../common/localization/locales';
import { getAddressOutput, toPlaceDto } from '../../common/utils/addressHelpers';

const libraries: ("places" | "marker")[] = ["places", "marker"];

export default function RiderPage() {
    const webApp = useTelegramWebApp();
    const [expanded, setExpanded] = useState(false);
    const center = { lat: 36.910894, lng: 30.720875 };

    // const [debug, setDebug] = useState<string | undefined>("");

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const [origin, setOrigin] = useState<google.maps.places.PlaceResult>();
    const [destination, setDestination] = useState<google.maps.places.PlaceResult>();

    const [initialMarker, setInitialMarker] = useState<google.maps.Marker>();

    const theme = useTheme();
    const sheetRef = useRef<BottomSheetRef>(null)

    const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
    const [sheetMinHeight, setSheetMinHeight] = useState(0);

    const [tariffInfo, setTariffInfo] = useState<{
        amount: number;
        formatted: string;
        currency: string;
    } | null>(null);

    const navigate = useNavigate();
    const onBackClick = () => {
        if(pointsDialogOpen) {
            setPointsDialogOpen(false);
            return;
        }
        navigate(-1);
    }

    const onMainClick = async () => {
        const rideRequest = {
            origin: toPlaceDto(origin!),
            destination: toPlaceDto(destination!)
        };
        try {
            webApp?.MainButton.showProgress();

            const initData = webApp?.initData;
            const response = await fetch(`https://localhost:52111/api/ride-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `tma ${initData}`,
                },
                body: JSON.stringify(rideRequest)
            });

            const result = await response.json();
            
            // перейти на waiting screen
            navigate("/waiting", { state: { rideRequestId: result.rideRequestId } });

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

    useEffect(() => {
        if (!map || !origin?.geometry?.location || !destination?.geometry?.location) return;

        // Маркеры
        setInitialMarker(undefined);
        initialMarker?.setMap(null);

        // Построение маршрута
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({ map });

        directionsService.route(
            {
                origin: origin.geometry.location,
                destination: destination.geometry.location,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            async (result, status) => {
                if (status === "OK" && result) {
                    directionsRenderer.setDirections(result);
                    // --- 3. Запросить цену после построения маршрута ---
                    try {
                        // setDebug("FETCH START...");

                        const payload = {
                                origin: {
                                    latitude: origin.geometry?.location?.lat(),
                                    longitude: origin.geometry?.location?.lng(),
                                },
                                destination: {
                                    latitude: destination.geometry?.location?.lat(),
                                    longitude: destination.geometry?.location?.lng(),
                                },
                            };
                        // setDebug(d => d + "\nBODY: " + JSON.stringify(payload));
                        
                        // https://ix5gkk15w7.execute-api.il-central-1.amazonaws.com/default
                        const initData = webApp?.initData;
                        const response = await fetch(
                            "https://localhost:52111/api/tariff/calculate",
                            {
                                method: "POST",
                                headers: { 
                                    "Content-Type": "application/json",
                                    "Authorization": `tma ${initData}`
                                },
                                body: JSON.stringify(payload),
                            }
                        );

                        // setDebug(d => d + "\nSTATUS: " + response.status);
                        // const raw = await response.clone().text();
                        // setDebug(d => d + "\nRAW: " + raw);

                        if (!response.ok) {
                            console.error("Tariff API error", response.status);
                            setTariffInfo({
                                amount: 555,
                                formatted: response.statusText,
                                currency: 'TRY'
                            });
                            return;
                        }

                        const data = await response.json();

                        // --- 4. Кладём цену в стейт ---
                        setTariffInfo(data); // { amount, formatted, currency }
                    } catch (err) {
                        console.error("Tariff API request failed", err);
                    }
                } else {
                    console.error("Directions request failed:", status);
                }
            }
        );

        return () => {
            directionsRenderer.setMap(null);
        };
    }, [map, origin, destination, initialMarker]);

    const handleDrawerClose = (origin: google.maps.places.PlaceResult, destination: google.maps.places.PlaceResult) => {
        setOrigin(origin);
        setDestination(destination);
    };

    async function getCurrentLocation(): Promise<google.maps.LatLngLiteral | null> {
        return new Promise<google.maps.LatLngLiteral | null>((resolve) => {
            const locationManager = window.Telegram?.WebApp?.LocationManager;
            if (locationManager?.isLocationAvailable) {
                locationManager?.getLocation((location: LocationData | null) => {
                    if (location) {
                        resolve({ lat: location.latitude, lng: location.longitude });
                    } else {
                        resolve(null);
                    }
                });
            }
            else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), 
                    error => { 
                        console.error("Geolocation error:", error);
                        resolve(null); 
                    }, 
                    { enableHighAccuracy: true, timeout: 500 }); 
                return; 
            }
            resolve(null);            
        });
    }

    useEffect(() => {
        (async () => {
            const loc = await getCurrentLocation() ?? center;
            if (loc && map) {
                    map.panTo(loc);
                    const marker = new google.maps.Marker({ map, position: loc, label: "WE" });
                    setInitialMarker(marker);
                }
                const place = await getPlaceFromCoords(loc);
                setOrigin(place!);
            }
        )();
    }, [map]);

    useEffect(() => {
        const lm = window.Telegram?.WebApp?.LocationManager;
        lm?.init();
    }, [map]);

    // const mapStyle: google.maps.MapTypeStyle[] = [
    //     { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    //     { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    //     { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    //     {
    //         featureType: 'road',
    //         elementType: 'geometry',
    //         stylers: [{ color: '#484848' }],
    //     },
    //     {
    //         featureType: 'water',
    //         elementType: 'geometry',
    //         stylers: [{ color: '#0f252e' }],
    //     },
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

    const originAddress = getAddressOutput(origin);
    const destinationAddress = getAddressOutput(destination);

    return (

        <Stack sx={{ height: "100vh", position: "relative" }}>
            <LoadScript
                googleMapsApiKey="AIzaSyDeqs7L-oHz0FCPtzJswpzxdhqosiA95PM"
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
            </LoadScript>
            <BottomSheet
                ref={sheetRef}
                open={true}
                expandOnContentDrag 
                blocking={false}
                snapPoints={({ minHeight, maxHeight }) => {
                    setSheetMinHeight(minHeight); 
                    return [minHeight, 0.8 * maxHeight];
                }}
                defaultSnap={({ minHeight }) => minHeight }
                onSpringEnd={(event: SpringEvent) => {
                    if(event.type === 'SNAP') {
                        setExpanded(!expanded);
                    }
                }}>
                <Stack
                    padding='10px'
                    direction="column"
                    alignItems="stretch"
                    divider={<Divider
                        sx={{
                            borderColor: theme.palette.text.secondary,
                            opacity: 0.5,
                            width: 'calc(100% - 30px)',
                            alignSelf: 'flex-end'
                        }}
                        orientation="horizontal"
                        flexItem/>}
                    spacing={1}>
                    <Stack
                        onClick={() => setPointsDialogOpen(true)}
                        direction="row"
                        justifyContent="space-between"
                        spacing={1}
                        alignItems="center">
                        <HailingIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/> 
                        <Stack
                            sx={{
                                flex: 1,
                                color: origin ? 'text.primary' : 'text.secondary'
                            }}>
                            <Typography
                                sx={{
                                    
                                }}>
                                {originAddress.shortName}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                }}>
                                {originAddress.fullAddress}
                            </Typography>
                        </Stack>     
                    </Stack>
                    <Stack
                        onClick={() => setPointsDialogOpen(true)}
                        direction="row"
                        justifyContent="space-between"
                        spacing={1}
                        alignItems="center">
                        <FinishIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>      
                        {!destination && <Typography
                            sx={{
                                flex: 1,
                                textAlign: 'left',
                                color: 'text.secondary'
                            }}>
                            Select destination
                        </Typography>}
                        {destination && <Stack
                            sx={{
                                flex: 1,
                                color: origin ? 'text.primary' : 'text.secondary'
                            }}>
                            <Typography
                                sx={{
                                    
                                }}>
                                {destinationAddress.shortName}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                }}>
                                {destinationAddress.fullAddress}
                            </Typography>
                        </Stack>}
                    </Stack>
                </Stack>

                {tariffInfo && <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                        backgroundColor: 'rgba(100,100,50,0.2)',
                    }}>
                    {tariffInfo ? tariffInfo.formatted : '₺93,84'}
                </Typography>}

                <TeleGoPointsDrawer
                    open={pointsDialogOpen}
                    setOpen={setPointsDialogOpen}
                    map={map!}
                    origin={origin}
                    destination={destination}
                    handleClose={handleDrawerClose}
                />
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

            {pointsDialogOpen && 
                <WebAppBackButton
                    onClick={onBackClick} />}

                {/* <div
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.8)",
                        color: "lime",
                        padding: "6px",
                        fontSize: "10px",
                        zIndex: 99999,
                        maxHeight: "30%",
                        overflowY: "auto"
                    }}
                >
                    {debug}
                </div> */}
        </Stack>
    );
}
