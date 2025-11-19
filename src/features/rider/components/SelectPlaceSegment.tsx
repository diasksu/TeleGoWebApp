import { Stack, Typography } from "@mui/material";
import { getAddressOutput } from "../../../common/utils/addressHelpers";

interface SelectPlaceSegmentProps {
    place?: google.maps.places.PlaceResult;
    title: string;
    setPointsDialogOpen: (open: boolean) => void;
    icon: JSX.Element;
}

export default function SelectPlaceSegment({
    place,
    title,
    setPointsDialogOpen,
    icon
}: SelectPlaceSegmentProps) {
    const placeAddress = getAddressOutput(place);
    return <Stack
                onClick={() => setPointsDialogOpen(true)}
                direction="row"
                justifyContent="space-between"
                spacing={1}
                alignItems="center">
                {icon}
                {!place && <Typography
                    sx={{
                        flex: 1,
                        textAlign: 'left',
                        color: 'text.secondary'
                    }}>
                    {title}
                </Typography>}
                {place && <Stack
                    sx={{
                        flex: 1,
                        color: origin ? 'text.primary' : 'text.secondary'
                    }}>
                    <Typography
                        sx={{
                            
                        }}>
                        {placeAddress.shortName}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 12,
                        }}>
                        {placeAddress.fullAddress}
                    </Typography>
                </Stack>}
            </Stack>;
 }