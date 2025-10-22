import { 
    Stack, 
    Typography
} from '@mui/material';
import '../../../assets/css/takeme.css';
import dayjs from 'dayjs';
import { TakeMeDatePicker } from '../TakeMeDatePicker';

type ChooseDateSegmentProps = {
    caption: string;
    value?: dayjs.Dayjs;
    setValue: (value?: dayjs.Dayjs) => void;
    minDate?: dayjs.Dayjs;
};

export default function ChooseDateSegment(props: Readonly<ChooseDateSegmentProps>) {
    return <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center">
        <Typography>{props.caption}</Typography>
        <TakeMeDatePicker
            value={props.value}
            setValue={props.setValue}
            minDate={props.minDate} />
    </Stack>
}