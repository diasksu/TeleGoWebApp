import { Stack, Typography } from "@mui/material";

export default function GoingToPickupSheet() 
{
    return  <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    Heading to pickup location...
                </Typography>
            </Stack>;
}