import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LeadModalProvider } from './features/open-lead-modal/LeadModalProvider';
import { AppRouter } from './app/router/AppRouter';
import './app/styles/global.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LeadModalProvider>
          <AppRouter />
        </LeadModalProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
