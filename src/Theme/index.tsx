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

export default useTheme; 