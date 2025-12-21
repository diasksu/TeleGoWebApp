import { Stack, Typography } from "@mui/material";

interface DriverArrivedSheetProps {
    rideCode: number;
}

export default function DriverArrivedSheet({ 
    rideCode
}: DriverArrivedSheetProps) 
{
    return <Stack>
        <Typography
            sx={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: "center",
                padding: '15px',
            }}>
            Driver arrived!
        </Typography>
        <Typography
            sx={{
                fontSize: 16,
                textAlign: "center",
                padding: '0 15px 15px 15px',
            }}>
            Tell your driver your ride code: <strong>{rideCode}</strong>
        </Typography>
    </Stack>
}