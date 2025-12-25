import { Stack, Typography } from "@mui/material";
import type { PassengerActiveRideProjection } from "../types";
import { getFormatted } from "../../../common/utils/priceHelpers";

interface RideInProgressSheetProps {
    readonly ride: PassengerActiveRideProjection;
}

export default function RideInProgressSheet({ 
    ride
}: RideInProgressSheetProps) 
{
    return <Stack>
        <Typography
            sx={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: "center",
                padding: '15px',
            }}>
            Your trip has started
        </Typography>
        <Typography
            sx={{
                fontSize: 16,
                textAlign: "center",
                padding: '0 15px 15px 15px',
            }}>
            Fare: {getFormatted(ride.offer_price)}
            <br />
            Please pay the driver directly after the trip.
            <br />
            You can leave a rating and comment within 3 days.
        </Typography>
    </Stack>
}