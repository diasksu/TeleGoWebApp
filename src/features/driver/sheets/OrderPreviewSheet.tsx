import { Button, Stack, Typography } from "@mui/material";
import type { DriverOfferFullDto } from "../types";
import { getFormatted } from "../../../common/utils/priceHelpers";

interface OrderPreviewSheetProps {
    readonly offer: DriverOfferFullDto;
    readonly acceptOffer: () => Promise<void>;
    readonly declineOffer: () => Promise<void>;
}

export default function OrderPreviewSheet({ 
    offer,
    acceptOffer,
    declineOffer
}: OrderPreviewSheetProps) 
{
    return  <Stack>
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: "center",
                        padding: '15px',
                    }}>
                    You have a new ride offer!
                </Typography>
                <Stack sx={{ padding: '0 15px 15px 15px' }}>
                    <Typography>
                        Passenger: {offer?.passenger_name}
                    </Typography>
                    <Typography>
                        Distance to pickup: {(offer?.distance_meters ?? 0) / 1000} km
                    </Typography>
                    <Typography>
                        From: {offer?.origin.short_name}
                    </Typography>
                    <Typography>
                        To: {offer?.destination.short_name}
                    </Typography>
                    <Typography>
                        Price: {getFormatted(offer.price)}
                    </Typography>
                </Stack>
                <Stack 
                    direction="row"
                    spacing={1}
                    sx={{ 
                        width: "100%", 
                        padding: '10px'
                    }}>
                    <Button sx={{ 
                            flex: 1,
                            backgroundColor: "var(--tg-theme-button-color)",
                            color: "var(--tg-theme-button-text-color)",
                            "&:hover": {
                                opacity: 0.92
                            }
                        }}
                        onClick={acceptOffer}>
                        Принять
                    </Button>
                    <Button sx={{ 
                            flex: 1,
                            backgroundColor: "var(--tg-theme-secondary-bg-color)",
                            color: "var(--tg-theme-destructive-text-color)",
                            "&:hover": {
                                opacity: 0.92
                            }
                        }}
                        onClick={declineOffer}>
                        Отклонить
                    </Button>
                </Stack>
            </Stack>;
}