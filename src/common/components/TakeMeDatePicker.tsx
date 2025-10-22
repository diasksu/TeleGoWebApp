import { useTheme } from '@mui/material/styles';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs from 'dayjs';

export interface TakeMeDatePickerProps {
    value?: dayjs.Dayjs;
    setValue: (value?: dayjs.Dayjs) => void;
    minDate?: dayjs.Dayjs;
}

export function TakeMeDatePicker(props: Readonly<TakeMeDatePickerProps>) {
    const onChange = (value: dayjs.Dayjs | null) => {
        if(value !== null) {
            props.setValue(value);
        }
    };

    const theme = useTheme();

    return <MobileDatePicker
        format='D MMM YYYY'
        value={props.value}
        onChange={onChange}
        minDate={props.minDate ?? props.value}
        sx={{
            maxWidth: '170px',
            padding: '0px',
            borderWidth: '0px',
            "& .MuiPickersOutlinedInput-root": { 
                borderRadius: '10px',
                background: 'var(--tg-section-bg-color)'
            },
            "& .MuiPickersOutlinedInput-notchedOutline": {
                borderWidth: '0px'
            },
            "& .MuiPickersSectionList-root": {
                padding: '5px 0px 6px 5px',
                textAlign: 'right',
                lineHeight: '35px'
            },
            "& .MuiButtonBase-root": {
                color: theme.palette.primary.main
            }
        }}
    />;
}