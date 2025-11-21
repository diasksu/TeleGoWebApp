import { 
    CircularProgress,
    Divider, 
    Drawer, 
    List, 
    ListItem, 
    ListItemButton, 
    ListItemText, 
    Stack, 
    TextField, 
    Typography, 
    useTheme 
} from "@mui/material";
import FinishIcon from "../../assets/icons/FinishIcon";
import HailingIcon from "../../assets/icons/HailingIcon";
import { useEffect, useState } from "react";
import { locales } from "../localization/locales";
import { getPlaces } from "../../api/googleMapsApi";
import { getAddressOutput } from '../../common/utils/addressHelpers';

export interface TeleGoPointsDrawerProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    origin?: google.maps.places.PlaceResult;
    destination?: google.maps.places.PlaceResult;
    handleClose: (origin: google.maps.places.PlaceResult, destination: google.maps.places.PlaceResult) => void;
    map: google.maps.Map;
    activeField: 'origin' | 'destination';
}

enum PlaceKind {
  Origin = 'Origin',
  Destination = 'Destination'
}

export function TeleGoPointsDrawer(props: Readonly<TeleGoPointsDrawerProps>) {
    const theme = useTheme();

    const originAddress = getAddressOutput(props.origin);
    const destinationAddress = getAddressOutput(props.destination);

    const [origin, setOrigin] = useState(props.origin);
    const [destination, setDestination] = useState(props.destination);
    const [originInput, setOriginInput] = useState(originAddress.shortName);
    const [destinationInput, setDestinationInput] = useState(destinationAddress.shortName);
    const [placeKind, setPlaceKind] = useState(PlaceKind.Origin);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
    const [processing, setProcessing] = useState<boolean>(false);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [justSelected, setJustSelected] = useState(false);

    const [placesList, setPlacesList] = useState<google.maps.places.PlaceResult[]>([]);

    useEffect(() => {
        setOrigin(props.origin);
        setOriginInput(originAddress.shortName);
    }, [props.origin, originAddress.shortName]);

    useEffect(() => {
        setDestination(props.destination);
        setDestinationInput(destinationAddress.shortName);
    }, [props.destination, destinationAddress.shortName]);

    const handleInput = async (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
        kind: PlaceKind, 
        setInput: React.Dispatch<React.SetStateAction<string>>) => 
    {
        const rawInput = event.target.value;
        setPlaceKind(kind);
        setInput(rawInput);
        if(timeoutId) {
            clearTimeout(timeoutId);
        }
        if(rawInput.length < 2) {
            setPlacesList([]);
            return;
        }
        const resetNotFound = () => {
            setNotFound(false);
        }
        const processInput = async () => {
            setProcessing(true);
            const places = await getPlaces(props.map, rawInput);
            if(places?.length === 0) {
                setNotFound(true);
                setTimeout(resetNotFound, 500);
            }
            setProcessing(false);
            setPlacesList(places);
        }
        const newTimeoutId = setTimeout(processInput, 500);
        setTimeoutId(newTimeoutId);
    };
    
    const handlePlaceClick = async (event: React.MouseEvent, place: google.maps.places.PlaceResult) => {
        const placeAddress = getAddressOutput(place);
        if(placeKind == PlaceKind.Origin) {
            setOrigin(place);
            setOriginInput(placeAddress.shortName);
        }
        else {
            setDestination(place); 
            setDestinationInput(placeAddress.shortName);
        }
        setJustSelected(true);
        setPlacesList([]);
    };

    useEffect(() => {
        if(origin && destination && justSelected ) {
            props.handleClose(origin, destination);
            props.setOpen(false);
            setJustSelected(false);
        }
    }, [origin, destination, justSelected, props]);

    return <Drawer
            sx={{
                '& .MuiPaper-root': {
                    background: theme.palette.background.default,
                    height: `calc(100%)`,
                    overflow: 'visible',
                }
            }}
            anchor='bottom'
            open={props.open}
            onClose={() => props.setOpen(false)}>
            <Stack
                sx={{
                    margin: '10px',
                    borderRadius: '15px',
                }}>
    
                <Stack
                    padding='5px 10px'
                    direction="column"
                    alignItems="stretch"
                    spacing={0.5}
                    divider={<Divider
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            opacity: 0.5,
                            width: 'calc(100% - 30px)',
                            alignSelf: 'flex-end'
                        }}
                        orientation="horizontal"
                        flexItem />}
                    sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '15px',
                    }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center">
                        <HailingIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>      
                        <TextField
                            value={originInput}
                            onChange={(e) => handleInput(e, PlaceKind.Origin, setOriginInput)}
                            autoComplete="off"
                            autoFocus={props.activeField === 'origin'}
                            placeholder="Откуда поедете"
                            sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { border: 'none' },
                                },
                                '& .MuiOutlinedInput-input': {
                                    padding: '4px 8px',
                                },
                            }}/>
                    </Stack>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center">
                        <FinishIcon sx={{ fontSize: 24, color: '#e3e3e3' }}/>      
                        <TextField
                            value={destinationInput}
                            onChange={(e) => handleInput(e, PlaceKind.Destination, setDestinationInput)}
                            autoComplete="off"
                            autoFocus={props.activeField === 'destination'}
                            placeholder="Куда поедете"
                            sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { border: 'none' },
                                },
                                '& .MuiOutlinedInput-input': {
                                    padding: '4px 8px',
                                },
                            }}/>
                    </Stack>
                </Stack>
                <List
                    sx={{ 
                        width: '100%'
                    }}>
                    {placesList?.map((place: google.maps.places.PlaceResult) => (
                        <ListItem 
                            key={place.place_id}
                            divider 
                            disablePadding
                            sx={{
                                padding: '0px',
                            }}>
                            <ListItemButton onClick={e => handlePlaceClick(e, place)}>
                                <ListItemText primary={`${place.formatted_address})`} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                 {processing && <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <CircularProgress />
                </div>}
                {(placesList?.length === 0 && !processing) && <Typography style={{
                        margin: '10px',
                        fontWeight: 100,
                        textAlign: 'center',
                        color: theme.palette.text.secondary
                    }}>
                        {!notFound && locales.inputPlaceWelcomeText}
                        {notFound && locales.nothingFound}
                </Typography>}
            </Stack>
        </Drawer>
}
