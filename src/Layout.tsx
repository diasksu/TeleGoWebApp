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
                height: '100vh', // фиксируем полную высоту окна
                padding: '0px',
                fontStyle: 'normal',
                maxWidth: 'md',
                overflow: 'hidden', // не даем MUI вмешиваться
            }}>
            <Box sx={{ height: '100%', justifyContent: 'center', touchAction: 'none', position: 'relative' }}>
                {children}
            </Box>
        </Container>
    );
}
