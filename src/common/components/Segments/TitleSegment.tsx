import { 
    Paper, 
    Typography
} from '@mui/material';
import AirIcon from '../../../assets/images/airplane-postal.svg?react';
import '../../../assets/css/takeme.css';
import { locales } from '../../localization/locales';

type TitleSegmentProps = {
    hideCaption?: boolean;
};

export function TitleSegment(props: Readonly<TitleSegmentProps>) {
    return <Paper sx={{    
        textAlign: 'center',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'none',
        backgroundColor: 'transparent',               
        flexGrow: 1 }}>
        <AirIcon style={{ margin: '5px' }} />
        <Typography variant='h1'>Tele Go</Typography>
        <br />
        <Typography style={{
            display: props.hideCaption ? 'none' : 'block',
            width: '80%',
            fontWeight: 100
        }}>{locales.titleCaption}</Typography>
    </Paper>;
}
