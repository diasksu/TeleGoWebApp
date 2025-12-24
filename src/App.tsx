import { AppRoutes } from './common/routes/AppRoutes';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, type Theme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSearchParams } from 'react-router-dom';
import { locales } from './common/localization/locales';
import { Layout } from './Layout';
import type { PaletteMode } from '@mui/material/styles';
import { useIsWebAppReady, useTelegramWebApp, useWebAppTheme } from '@kloktunov/react-telegram-webapp';
import { useEffect } from 'react';

interface ThemeParams {
  bg_color: `#${string}`;
  secondary_bg_color: `#${string}`;
  text_color: `#${string}`;
  hint_color: `#${string}`;
  link_color: `#${string}`;
  button_color: `#${string}`;
  button_text_color: `#${string}`;
  header_bg_color: `#${string}`;
  accent_text_color: `#${string}`;
  section_bg_color: `#${string}`;
  section_header_text_color: `#${string}`;
  subtitle_text_color: `#${string}`;
  destructive_text_color: `#${string}`;
  section_separator_color: `#${string}`;
  bottom_bar_bg_color: `#${string}`;
}

function createTakeMeTheme(
  colorScheme: PaletteMode | undefined,
  themeParams: ThemeParams
): Theme {
  const takeMeTheme = createTheme(
    {
      palette: {
        mode: colorScheme ?? 'dark',
        primary: {
          main: themeParams.button_color ?? '#5288c1',
        },
        text: {
          primary: themeParams.text_color ?? '#f5f5f5',
          secondary: themeParams.hint_color ?? '#708499',
          disabled: themeParams.hint_color ?? '#f5f5f5',
        },
        background: {
          paper: themeParams.secondary_bg_color ?? '#232e3c',
          default: themeParams.bg_color ?? '#17212b',
        },
      },
      typography: {
        fontSize: 14,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif, Inter, Avenir, Helvetica, Arial, sans-serif',
        button: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '17px',
        },
        h1: {
          fontSize: '22px',
          fontWeight: 500,
        },
        body1: {
          lineHeight: '22px',
        },
      },
      shape: {
        borderRadius: 13,
      },
    },
    locales.datePickerLocaleText
  );
  return takeMeTheme;
}

export default function App() {
  const { colorScheme, themeParams } = useWebAppTheme();
  const [searchParams] = useSearchParams();
  const languageCode = searchParams.get('language') ?? 'en';
  locales.setLanguage(languageCode);

  const theme = createTakeMeTheme(colorScheme, themeParams ?? {});
  const isReady = useIsWebAppReady();
  const webApp = useTelegramWebApp();

  useEffect(() => {
      webApp?.ready();
      webApp?.expand();
      window.Telegram?.WebApp?.LocationManager?.init();
  }, [webApp]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider 
        dateAdapter={AdapterDayjs} 
        adapterLocale={locales.datePickerLanguage}>
        <CssBaseline />
        <Layout>
          {isReady ? <AppRoutes /> : <></>}
        </Layout>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
