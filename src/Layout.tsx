import { type FC, type ReactElement } from 'react';
import { Box, Container } from '@mui/material';

type LayoutProps = {
    children: ReactElement;
};

// https://www.npmjs.com/package/@kloktunov/react-telegram-webapp
export const Layout: FC<LayoutProps> = ({ children }) => {
    return (
        <Container 
            sx={{
                height: '100%',
                padding: '7px',
                fontStyle: 'normal',
                maxWidth: 'md'
            }}>
            <Box sx={{ height: '100%', justifyContent: 'center' }}>
                {children}
            </Box>
        </Container>
    );
}
