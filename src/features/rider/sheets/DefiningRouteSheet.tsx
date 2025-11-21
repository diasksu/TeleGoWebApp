import { 
    Divider, 
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
import { useState } from "react";

interface DefiningRouteSheetProps {
    tariffState?: TariffState | null;
    map?: google.maps.Map | null;
    origin?: google.maps.places.PlaceResult;
    destination?: google.maps.places.PlaceResult;
    setOrigin?: (origin: google.maps.places.PlaceResult) => void;
    setDestination?: (destination: google.maps.places.PlaceResult) => void;
    pointsDialogOpen: boolean;
    setPointsDialogOpen: (open: boolean) => void;
}

export default function DefiningRouteSheet({ 
    tariffState,
    map,
    origin,
    destination,
    setOrigin,
    setDestination,
    pointsDialogOpen,
    setPointsDialogOpen
}: DefiningRouteSheetProps) 
{
    const theme = useTheme();
    const navigate = useNavigate();
    const [activeField, setActiveField] = useState<'origin' | 'destination'>('origin');

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
            <Typography sx={{ textAlign: 'center', padding: '15px', opacity: 0.8 }}>
                Loading tariff ...
            </Typography>
        )}
        {tariffState?.data && <Typography
            sx={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: "center",
                padding: '15px',
                backgroundColor: 'rgba(100,100,50,0.2)',
            }}>
            {tariffState?.data ? tariffState?.data.formatted : '₺93,84'}
        </Typography>}

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