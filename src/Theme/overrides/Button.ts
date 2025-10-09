import { Theme } from '@mui/material/styles';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        variant: true;
    }
}

const Button = (theme: Theme) => {
    return {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: "10px 30px !important" as const,
                    maxHeight: "75px",
                },
            },
        },
    };
};

export default Button;
