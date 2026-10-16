import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import React, { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import useTheme from '../Theme';
import LaunchDarklyProvider from '../lib/launchdarkly-provider';
import { AuthProvider } from '../lib/auth-context';
import { queryClient } from '../lib/query-client';
import Routes from './Routes';

// TanStack Query's cache inspector (floating button, bottom corner) - dev
// only; the production build drops this import entirely.
const ReactQueryDevtools =
    process.env.NODE_ENV === 'development'
        ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
        : () => null;

function App() {
  const theme = useTheme();

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {/*
          The app never reset the browser's default body margin (8px),
          so the window's own background showed through as a visible
          border around the whole app. CssBaseline resets that (and
          box-sizing, default font-family on raw text, etc.) to the theme.
        */}
        <CssBaseline />
        <LaunchDarklyProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Routes />
            </AuthProvider>
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          </QueryClientProvider>
        </LaunchDarklyProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;