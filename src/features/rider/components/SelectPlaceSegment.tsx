import { Stack, Typography } from "@mui/material";
import { getAddressOutput } from "../../../common/utils/addressHelpers";

interface SelectPlaceSegmentProps {
    place?: google.maps.places.PlaceResult;
    title: string;
    icon: JSX.Element;
    onOpen: () => void;
}

export default function SelectPlaceSegment({
    place,
    title,
    icon,
    onOpen
}: SelectPlaceSegmentProps) {
    const placeAddress = getAddressOutput(place);
    return <Stack
                onClick={onOpen}
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