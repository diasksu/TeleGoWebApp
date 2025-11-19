import { 
    Divider, 
    Stack, 
    Typography, 
    useTheme 
} from "@mui/material";
import HailingIcon from "../../../assets/icons/HailingIcon";
import FinishIcon from "../../../assets/icons/FinishIcon";
import { TeleGoPointsDrawer } from "../../../common/components/TeleGoPointsDrawer";
import type { TariffInfo } from "../types";
import SelectPlaceSegment from "../components/SelectPlaceSegment";
import { WebAppBackButton } from "@kloktunov/react-telegram-webapp";
import { useNavigate } from "react-router-dom";

interface DefiningRouteSheetProps {
    tariffInfo?: TariffInfo | null;
    map?: google.maps.Map | null;
    origin?: google.maps.places.PlaceResult;
    destination?: google.maps.places.PlaceResult;
    setOrigin?: (origin: google.maps.places.PlaceResult) => void;
    setDestination?: (destination: google.maps.places.PlaceResult) => void;
    pointsDialogOpen: boolean;
    setPointsDialogOpen: (open: boolean) => void;
}

export default function DefiningRouteSheet({ 
    tariffInfo,
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
                    setPointsDialogOpen={setPointsDialogOpen}
                    icon={<HailingIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>}
                />
                <SelectPlaceSegment 
                    place={destination}
                    title="Select destination"
                    setPointsDialogOpen={setPointsDialogOpen}
                    icon={<FinishIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>}
                />
            
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

        {pointsDialogOpen && 
            <WebAppBackButton
                onClick={onBackClick} />}
    </>;
}