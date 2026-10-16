import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import useTheme from '../Theme';
import LaunchDarklyProvider from '../lib/launchdarkly-provider';
import { AuthProvider } from '../lib/auth-context';
import Routes from './Routes';

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
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </LaunchDarklyProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;