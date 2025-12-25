import { Stack, Typography } from "@mui/material";
import type { PassengerActiveRideProjection } from "../types";

interface DriverEnRouteSheetProps {
    readonly ride: PassengerActiveRideProjection;
}

export default function DriverEnRouteSheet({ 
    ride
}: DriverEnRouteSheetProps) 
{
    const user = ride.driver_user
    return <Stack>
        <Typography
            sx={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: "center",
                padding: '15px',
            }}>
            Driver found!
        </Typography>
        <Typography
            sx={{
                fontSize: 16,
                textAlign: "center",
                padding: '0 15px 15px 15px',
            }}>
            Your driver {user.first_name} ({user.user_name ?? ''}) is on the way to your pickup location.
        </Typography>
    </Stack>
}