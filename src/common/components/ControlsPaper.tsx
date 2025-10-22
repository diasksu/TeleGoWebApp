import { Divider, Paper, Stack, useTheme } from "@mui/material";
import { type FC, type ReactElement } from "react";

type ControlsPaperProps = {
    children: ReactElement[] | ReactElement;
};

export const ControlsPaper: FC<ControlsPaperProps> = ({ children }) => {
    const theme = useTheme();
    return <Paper
        style={{
            margin: '10px',
            backgroundImage: 'none'                            
        }}>
        <Stack
            padding='10px 15px'
            direction="column"
            alignItems="stretch"
            spacing={1}
            divider={<Divider
                sx={{
                    borderColor: theme.palette.text.secondary,
                    opacity: 0.2
                }}
                orientation="horizontal"
                flexItem />}>
            {children}
        </Stack>
    </Paper>;
}
    