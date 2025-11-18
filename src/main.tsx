// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom';
import { TelegramWebApp } from '@kloktunov/react-telegram-webapp';
import App from './App';

const root = createRoot(
  document.getElementById('app') as HTMLElement
);

root.render(
  // <StrictMode>
    <HashRouter>
      <TelegramWebApp>
        <App />
      </TelegramWebApp>
    </HashRouter>
  // </StrictMode>
);
