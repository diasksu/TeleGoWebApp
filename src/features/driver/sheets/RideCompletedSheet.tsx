import { Stack, Typography } from "@mui/material";

interface RideCompletedSheetProps {
    readonly goOffline: () => void;
}

export default function RideCompletedSheet({ 
    goOffline
}: RideCompletedSheetProps) 
{
    return  <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    You have completed the ride.
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography variant="body2" color="text.secondary">
                        Если вы хотите, можете остаться в оффлайн.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            textDecoration: 'underline',
                            color: '#3876F0',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                        onClick={goOffline} 
                    >
                        Оставаться в оффлайн
                    </Typography>
                </Stack>
            </Stack>;
}