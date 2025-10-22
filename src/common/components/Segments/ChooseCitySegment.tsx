import { 
    Button, 
    Stack, 
    Typography
} from '@mui/material';
import { type GeoName } from '../../../api/geoNamesApi';
import '../../../assets/css/takeme.css';
import { locales } from '../../localization/locales';
import { TakeMeCityDrawer } from '../TakeMeCityDrawer';

type ChooseCitySegmentProps = {
    caption: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    city?: GeoName;
    setCity: (city: GeoName) => void;
};

export default function ChooseCitySegment(props: Readonly<ChooseCitySegmentProps>) {
    const handleCityClickOpen = () => {
        props.setOpen(true);
    };
    
    const handleCityDrawerClose = (city?: GeoName) => {
        props.setOpen(false);
        if(city) {
            props.setCity(city);
        }
    };

    return <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center">
        <Typography>{props.caption}</Typography>                                
        <Button
            onClick={handleCityClickOpen}
            sx={{
                backgroundColor: 'var(--tg-section-bg-color)',
                padding: '7px 30px',
                borderRadius: '10px'
            }}>
            <Typography>
                {props.city 
                    ? `${props.city.name} (${props.city.countryCode})` 
                    : `${locales.chooseCityButtonCaption} >`}
            </Typography>
        </Button>      
        <TakeMeCityDrawer
            placeholder={props.caption}
            isOpen={props.open}
            handleClose={handleCityDrawerClose}
        />
    </Stack>
}