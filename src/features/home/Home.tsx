import { 
    Stack,
    Typography,
    Button,
    useTheme
} from '@mui/material';
import '../../assets/css/takeme.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locales } from '../../common/localization/locales';
import { MuiSwitchLarge } from '../../common/components/SwitchLarge';
import type { ChangeEvent } from "react";
import { UseType } from '../../models/Enums';
import { TitleSegment } from '../../common/components/Segments/TitleSegment';

export default function Home() {
    const [useType, setUseType] = useState(UseType.Rider);
    const navigate = useNavigate();
    const theme = useTheme();

    const onClick = () => {        
        navigate(useType.toLowerCase());
    }

    const onUseTypeChange = (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setUseType(checked ? UseType.Rider : UseType.Driver);
    }

    return (
        <Stack 
            spacing={1} 
            sx={{ 
                height: '100%',
                justifyContent: 'center'
            }}
            direction="column"
            alignItems="stretch">
            <TitleSegment />
            <Stack
                sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                direction="row"
                spacing={0.5}>
                <Typography>{locales.riderButtonCaption}</Typography>
                    <MuiSwitchLarge
                        value={useType}
                        onChange={onUseTypeChange} />
                <Typography>{locales.driverButtonCaption}</Typography>              
            </Stack>          
            <Button
                sx={{
                    color: theme.palette.text.primary,
                    background: theme.palette.primary.main
                }}
                onClick={onClick}>{locales.mainButtonCaptionContinue}</Button>
        </Stack>
    );
}
