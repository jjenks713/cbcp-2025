import palette from './palette';
import components from './overrides';
import { createTheme } from '@mui/material';

export const getThemeOptions = () => ({
        palette,
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: 14,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 700,
        },
        shape: { borderRadius: 8 },
});

const useTheme = () => {
    const themeOptions = getThemeOptions();
    const theme = createTheme(themeOptions);
    theme.components = components(theme);
    return theme;
}

// The site palette pairs a white background.paper with near-white text,
// which leaves Dialogs, Tables, Menus and Autocomplete popups unreadable.
// The admin panel is almost entirely those, so it gets a dark-mode variant.
export const createAdminTheme = () => {
    const base = getThemeOptions();
    const theme = createTheme({
        ...base,
        palette: {
            ...base.palette,
            mode: 'dark',
            // The site's #b30e0e error red is too dark to read on these surfaces.
            error: { main: '#f2685f' },
            background: { default: '#1e1e1e', paper: '#262626' },
            divider: 'rgba(255, 255, 255, 0.12)',
            action: {
                hover: 'rgba(255, 255, 255, 0.08)',
                selected: 'rgba(255, 255, 255, 0.16)',
                disabled: 'rgba(255, 255, 255, 0.3)',
                disabledBackground: 'rgba(255, 255, 255, 0.12)',
            },
        },
    });
    theme.components = components(theme);
    return theme;
}

export default useTheme; 