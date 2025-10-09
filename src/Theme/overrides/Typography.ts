import { Theme } from '@mui/material/styles';
declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        h1: true;
        h2: true;
        h3: true;
        h4: true;
        h5: true;
        h6: true;
        subtitle1: true;
        subtitle2: true;
        body1: true;
        body2: true;
        button: true;
        caption: true;
        overline: true;
        srOnly: true;
        inherit: true;
        variant: true;
    }}

const Typography = (theme: Theme) => {
    return {
        MuiTypography: {
            defaultProps: {
                color: 'textPrimary',
            },
            styleOverrides: {
                root: {
                    fontWeight: 400,
                    fontSize: '1rem',
                    lineHeight: '1.5',
                },
                h1: {
                    fontWeight: 700,
                    fontSize: '2.5rem',
                    lineHeight: '1.2',
                },
                h2: {
                    fontWeight: 700,
                    fontSize: '2rem',
                    lineHeight: '1.3',
                },
                h3: {
                    fontWeight: 700,
                    fontSize: '1.75rem',
                    lineHeight: '1.4',
                },
                h4: {
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    lineHeight: '1.5',
                },
                h5: {
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    lineHeight: '1.6',
                },
                h6: {
                    fontWeight: 700,
                    fontSize: '1rem',
                    lineHeight: '1.7',
                },
            },
        },
    };
};

export default Typography;