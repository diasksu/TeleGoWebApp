import { 
    Stack, 
    Typography,
    useTheme
} from '@mui/material';
import '../../assets/css/takeme.css';
import CustomWebAppMainButton from '../../common/components/WebApp/CustomWebAppMainButton';
import { WebAppBackButton, useTelegramWebApp } from '@kloktunov/react-telegram-webapp';
import { useNavigate } from 'react-router-dom';
import ChooseCitySegment from '../../common/components/Segments/ChooseCitySegment';
import ChooseDateSegment from '../../common/components/Segments/ChooseDateSegment';
import AddCommentSegment from '../../common/components/Segments/AddCommentSegment';
import { ControlsPaper } from '../../common/components/ControlsPaper';
import { locales } from '../../common/localization/locales';
import { useState, useEffect } from 'react';
import { type GeoName } from '../../api/geoNamesApi';
import dayjs from 'dayjs';

export default function RiderPage() {
    const [originDialogOpen, setOriginDialogOpen] = useState(false);
    const [origin, setOrigin] = useState<GeoName>();

    const [destinationDialogOpen, setDestinationDialogOpen] = useState(false);
    const [destination, setDestination] = useState<GeoName>();

    const [startDate, setStartDate] = useState<dayjs.Dayjs | undefined>(dayjs());
    const [endDate, setEndDate] = useState<dayjs.Dayjs | undefined>(startDate?.add(1));

    const [comment, setComment] = useState<string>();

    const handleStartDateChange = (value?: dayjs.Dayjs) => {
        setStartDate(value);
        if(!value || !endDate) {
            return;
        }
        if(value.isAfter(endDate, 'day')) {
            setEndDate(value);
        }
    }

    const navigate = useNavigate();
    const theme = useTheme();
    const onBackClick = () => {
        if(originDialogOpen) {
            setOriginDialogOpen(false);
            return;
        }
        if(destinationDialogOpen) {
            setDestinationDialogOpen(false);
            return;
        }
        navigate(-1);
    }

    const webApp = useTelegramWebApp();
    const onMainClick = () => {
        const userInputData = {
            useType: 'rider',
            origin,
            destination,
            startDate,
            endDate,
            comment
        };
        webApp?.sendData(JSON.stringify(userInputData));
    }

    useEffect(
        () => {
            webApp?.expand();
        }, 
        [webApp]
    );

    return (
        <Stack>
            <ControlsPaper>
                <ChooseDateSegment
                    value={startDate}
                    setValue={handleStartDateChange}
                    caption={locales.packageActualFrom}
                    minDate={dayjs()} />
                <ChooseDateSegment
                    value={endDate}
                    setValue={setEndDate}
                    minDate={startDate}
                    caption={locales.packageActualTo} />
                <ChooseCitySegment
                    caption={locales.cityFrom}
                    open={originDialogOpen}
                    setOpen={setOriginDialogOpen}
                    city={origin}
                    setCity={setOrigin} />
                <ChooseCitySegment
                    caption={locales.cityTo} 
                    open={destinationDialogOpen}
                    setOpen={setDestinationDialogOpen}
                    city={destination}
                    setCity={setDestination}  />
                <AddCommentSegment
                    caption={locales.commentLabel}
                    placeholder={locales.commentSendPlaceholder}
                    comment={comment}
                    setComment={setComment}  />
            </ControlsPaper>

            <Typography 
                style={{
                    flexGrow: 1,
                    margin: '10px',
                    fontWeight: 100,
                    textAlign: 'center',
                    color: theme.palette.text.secondary
                }}>{locales.sendPackageHelperText}
            </Typography>

            {(!originDialogOpen && !destinationDialogOpen) && 
                <CustomWebAppMainButton
                    disable={!(startDate && endDate && origin && destination)}
                    text={locales.riderButtonCaption}
                    onClick={onMainClick} />
            }

            {(originDialogOpen || destinationDialogOpen) && 
                <WebAppBackButton
                    onClick={onBackClick} />}
        </Stack>
    );
}
