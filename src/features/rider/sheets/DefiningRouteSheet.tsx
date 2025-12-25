import { 
    Divider, 
    IconButton, 
    Stack, 
    Typography, 
    useTheme 
} from "@mui/material";
import HailingIcon from "../../../assets/icons/HailingIcon";
import FinishIcon from "../../../assets/icons/FinishIcon";
import { TeleGoPointsDrawer } from "../../../common/components/TeleGoPointsDrawer";
import type { TariffState } from "../types";
import SelectPlaceSegment from "../components/SelectPlaceSegment";
import { WebAppBackButton } from "@kloktunov/react-telegram-webapp";
import { useNavigate } from "react-router-dom";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { OfferPriceDto } from "../../../common/types";
import { getFormatted } from "../../../common/utils/priceHelpers";

interface DefiningRouteSheetProps {
    readonly tariffState?: TariffState | null;
    readonly map?: google.maps.Map | null;
    readonly origin?: google.maps.places.PlaceResult;
    readonly destination?: google.maps.places.PlaceResult;
    readonly setOrigin?: (origin: google.maps.places.PlaceResult) => void;
    readonly setDestination?: (destination: google.maps.places.PlaceResult) => void;
    readonly pointsDialogOpen: boolean;
    readonly setPointsDialogOpen: (open: boolean) => void;
    readonly adjustment: number;
    readonly setAdjustment: Dispatch<SetStateAction<number>>;
}

export default function DefiningRouteSheet({ 
    tariffState,
    map,
    origin,
    destination,
    setOrigin,
    setDestination,
    adjustment,
    setAdjustment,
    pointsDialogOpen,
    setPointsDialogOpen
}: DefiningRouteSheetProps) 
{
    const theme = useTheme();
    const navigate = useNavigate();
    const [activeField, setActiveField] = useState<'origin' | 'destination'>('origin');
    const estimation = tariffState?.data?.estimation;

    const handleDrawerClose = (origin: google.maps.places.PlaceResult, destination: google.maps.places.PlaceResult) => {
        setOrigin?.(origin);
        setDestination?.(destination);
    };

    const onBackClick = () => {
        if(pointsDialogOpen) {
            setPointsDialogOpen(false);
            return;
        }
        navigate(-1);
    }

    const onOpen = (field: 'origin' | 'destination') => {
        setActiveField(field);
        setPointsDialogOpen(true);
    }    

    const adjustPrice = (increase: boolean): void => {
        const limit = tariffState?.data?.estimation.adjustment_limit ?? 0;
        setAdjustment(prev => {
            const next = increase ? prev + 1 : prev - 1;
            if (next < - limit) return prev;
            if (next > limit) return prev;
            return next;
        });
    }

    const offerPrice : OfferPriceDto | null = estimation ? 
    {
        amount: estimation.amount + adjustment,
        currency_symbol: estimation.currency_symbol,
        currency_symbol_position: estimation.currency_symbol_position,
    } :
    null;

    return <>
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
                    
                <SelectPlaceSegment 
                    place={origin}
                    title="Select origin"
                    icon={<HailingIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>}
                    onOpen={() => onOpen('origin')}
                />
                <SelectPlaceSegment 
                    place={destination}
                    title="Select destination"
                    icon={<FinishIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>}
                    onOpen={() => onOpen('destination')}
                />
            
        </Stack>

        {tariffState?.loading && (
            <Typography sx={{ 
                textAlign: 'center', 
                padding: '15px', 
                borderTop: '1 px',
                opacity: 0.8 }}>
                Loading tariff ...
            </Typography>
        )}
        {estimation?.distance_km && (
            <Typography
                sx={{
                    color: "#bbb",
                    fontSize: "14px",
                    textAlign: "center",
                    borderTop: "1px solid #444",
                    borderBottom: "1px solid #444",
                    py: "6px",
                }}
            >
                📏 {estimation?.distance_km.toFixed(1)} km • 🕒 {Math.round(estimation?.duration_min || 0)} min
            </Typography>
        )}

        {offerPrice && (
            <Stack
                alignItems={"center"}
                justifyContent="center"
                direction="row">
                <IconButton
                    size="small"
                    sx={{
                        background: "#333",
                        color: "#fff",
                        "&:hover": { background: "#444" },
                        width: 30,
                        height: 30,
                        lineHeight: 1
                    }}
                    onClick={() => adjustPrice(false)}
                >
                    -
                </IconButton>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px'
                    }}>
                    {getFormatted(offerPrice)}
                </Typography>
                <IconButton
                    size="small"
                    sx={{
                        background: "#333",
                        color: "#fff",
                        "&:hover": { background: "#444" },
                        width: 30,
                        height: 30,
                        lineHeight: 1
                    }}
                    onClick={() => adjustPrice(true)}
                >
                    +
                </IconButton>
            </Stack>
        )}

        <TeleGoPointsDrawer
            open={pointsDialogOpen}
            setOpen={setPointsDialogOpen}
            map={map!}
            origin={origin}
            destination={destination}
            handleClose={handleDrawerClose}
            activeField={activeField}
        />

        {pointsDialogOpen && 
            <WebAppBackButton
                onClick={onBackClick} />}
    </>;
}