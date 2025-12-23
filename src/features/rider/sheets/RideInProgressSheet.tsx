import { Stack, Typography } from "@mui/material";
import type { PassengerActiveRideProjection } from "../types";

interface RideInProgressSheetProps {
    ride: PassengerActiveRideProjection;
}

export default function RideInProgressSheet({ 
    ride
}: RideInProgressSheetProps) 
{
    const price = ride.offer_price;
    const formattedPrice = price?.currency_symbol_position === 'before' ? 
        `${price?.currency_symbol}${price?.amount}` : 
        `${price?.amount}${price?.currency_symbol}`;
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
            Fare: {formattedPrice}
            <br />
            Please pay the driver directly after the trip.
            <br />
            You can leave a rating and comment within 3 days.
        </Typography>
    </Stack>
}