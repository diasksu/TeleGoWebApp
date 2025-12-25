import { Stack, TextField, Typography } from "@mui/material";
import type { DriverOfferFullDto } from "../types";

interface ArrivedAtPickupSheetProps {
    readonly offer: DriverOfferFullDto;
    readonly setPickupCode: React.Dispatch<React.SetStateAction<number>>;
    readonly webAppAlert: (message: string) => void;
}

export default function ArrivedAtPickupSheet({ 
    offer, 
    setPickupCode,
    webAppAlert
}: ArrivedAtPickupSheetProps) 
{
    return  <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    You have arrived at the pickup location.
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography>
                        Passenger: {offer?.passenger_name}
                    </Typography>
                    <Typography>
                        From: {offer?.origin.short_name}
                    </Typography>
                    <Typography>
                        To: {offer?.destination.short_name}
                    </Typography>
                     <Stack spacing={1} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Если по какой-то причине вы не смогли связаться с пассажиром,
                        вы можете отменить поездку.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            textDecoration: 'underline',
                            color: '#3876F0',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                        onClick={() => {webAppAlert("Поездка отменена")}} 
                    >
                        Отменить поездку
                    </Typography>
                    <Stack
                        spacing={1}
                        direction="row"
                        alignItems="center"
                    >
                        <Typography variant="body2" color="text.secondary">
                            Код посадки:
                        </Typography>
                        <TextField
                            onChange={(e) => setPickupCode(Number(e.target.value))}
                            variant="outlined"
                            size="small"
                            slotProps={{
                                htmlInput: {
                                    inputMode: 'numeric',
                                    maxLength: 4,
                                    minLength: 4
                                }
                            }}
                        />
                    </Stack>
                </Stack>
                </Stack>
            </Stack>;
}