import { LinearProgress, Stack, Typography } from "@mui/material";
import { getAddressOutput } from "../../../common/utils/addressHelpers";

interface WaitingForDriverSheetProps {
    readonly origin?: google.maps.places.PlaceResult;
    readonly destination?: google.maps.places.PlaceResult;
}

export default function WaitingForDriverSheet({ 
    origin,
    destination
}: WaitingForDriverSheetProps) 
{
    const originAddress = getAddressOutput(origin);
    const destinationAddress = getAddressOutput(destination);
    console.log(originAddress.shortName);
    console.log(destinationAddress.shortName);

    return <Stack>
        <Typography
            sx={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: "center",
                padding: '15px',
            }}>
            Looking for a driver...
        </Typography>
        <LinearProgress
            sx={{
                '& .MuiLinearProgress-bar': {
                    animationDuration: '4s', // по умолчанию ~2s
                },
            }} />
    </Stack>
}