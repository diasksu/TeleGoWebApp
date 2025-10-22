import { Switch } from '@mui/material';
import { styled } from '@mui/system';

export const MuiSwitchLarge = styled(Switch)(({ theme }) => ({
    width: 60,
    height: 30,
    padding: 7,
    "& .MuiSwitch-switchBase": {
        margin: 1,
        padding: 0,   
        transform: "translateX(6px)",
        "&.Mui-checked": {
            transform: "translateX(24px)",
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.5                                            
            }
        }
    },
    "& .MuiSwitch-thumb": {
        width: 28,
        height: 28,
        backgroundColor: theme.palette.primary.main,
        opacity: 1
    },
    "& .MuiSwitch-track": {
        borderRadius: 18 / 2,
        backgroundColor: theme.palette.primary.main,
        opacity: 0.5
    }
}));