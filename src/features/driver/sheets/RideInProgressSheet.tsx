import { Stack, Typography } from "@mui/material";
import type { DriverOfferFullDto } from "../types";

interface RideInProgressSheetProps {
    readonly offer: DriverOfferFullDto;
}

export default function RideInProgressSheet({ 
    offer
}: RideInProgressSheetProps) 
{
    return  <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    Ride in progress...
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography>
                        Passenger: {offer.passenger_name}
                    </Typography>
                    <Typography>
                        From: {offer.origin.short_name}
                    </Typography>
                    <Typography>
                        To: {offer.destination.short_name}
                    </Typography>
                </Stack>
            </Stack>;
}