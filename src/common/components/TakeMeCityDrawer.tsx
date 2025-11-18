import { 
    Stack, 
    TextField,
    Drawer,
    useTheme,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    CircularProgress
} from '@mui/material';
import { useState } from 'react';
import { type GeoName, getGeoNames } from '../../api/geoNamesApi';
import { locales } from '../localization/locales';

export interface TakeMeCityDrawerProps {
    isOpen: boolean;
    handleClose: (city?: GeoName) => void;
    placeholder: string;
}

export function TakeMeCityDrawer(props: Readonly<TakeMeCityDrawerProps>) {
    const theme = useTheme();
    const [cityInput, setCityInput] = useState<string>('');
    const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [geonames, setGeonames] = useState<GeoName[]>([]);
    const [processing, setProcessing] = useState<boolean>(false);
    const [notFound, setNotFound] = useState<boolean>(false);

    const handleTextChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const cityRawInput = event.target.value;
        setCityInput(cityRawInput);
        if(timeoutId) {
            clearTimeout(timeoutId);
        }
        if(cityRawInput.length < 2) {
            setGeonames([]);
            return;
        }
        const resetNotFound = () => {
            setNotFound(false);
        }
        const processCityInput = async () => {
            setProcessing(true);
            const geonames = await getGeoNames(cityRawInput);
            if(geonames?.length === 0) {
                setNotFound(true);
                setTimeout(resetNotFound, 1000);
            }
            setProcessing(false);
            setGeonames(geonames);
        }
        const newTimeoutId = setTimeout(processCityInput, 1000);
        setTimeoutId(newTimeoutId);
    };

    const handleCityClick = async (event: React.MouseEvent, geoname: GeoName) => {
        props.handleClose(geoname);
    };

    return <Drawer
        sx={{
            '& .MuiPaper-root': {
                background: theme.palette.background.default,
                height: `calc(100%)`,
                overflow: 'visible',
            }
        }}
        anchor='bottom'
        open={props.isOpen}
        onClose={() => props.handleClose()}>
        <Stack
            spacing={1}
            sx={{
                margin: '20px'
            }}>
            <TextField
                onChange={handleTextChange}
                value={cityInput}
                label={props.placeholder}
                sx={{
                    padding: '0px',
                    '.MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.text.secondary,
                    }
                }}/>
            {(geonames?.length > 0) && <List
                sx={{ 
                    width: '100%',
                    opacity: processing ? 0.5 : 1
                }}>
                {geonames?.map((geoname: GeoName) => (
                    <ListItem 
                        key={geoname.geonameId}
                        disablePadding
                        sx={{
                            marginTop: '3px',
                            padding: '3px',
                            background: theme.palette.background.paper
                        }}>
                        <ListItemButton onClick={e => handleCityClick(e, geoname)}>
                            <ListItemText primary={`${geoname.name} (${geoname.countryCode})`} />
                        </ListItemButton>
                    </ListItem>
                ))}                
            </List>}
            {processing && <div style={{textAlign: 'center', marginTop: '20px'}}>
                <CircularProgress />
            </div>}
            {(geonames?.length === 0 && !processing) && <Typography style={{
                    margin: '10px',
                    fontWeight: 100,
                    textAlign: 'center',
                    color: theme.palette.text.secondary
                }}>
                    {!notFound && locales.inputPlaceWelcomeText}
                    {notFound && locales.nothingFound}
            </Typography>}
        </Stack>
    </Drawer>;
}