import { useTheme } from '@mui/material/styles';
import { useWidth } from '../../hooks/use-responsive';
import { Variant } from './types';

function remToPx(value: string) {
  return Math.round(parseFloat(value) * 16);
}

export default function useTypography(variant: Variant) {
  const theme = useTheme();
  const breakpoints = useWidth();
  const key = theme.breakpoints.up(breakpoints === 'xl' ? 'lg' : breakpoints);
  const hasResponsive = ['h1','h2','h3','h4','h5','h6'].includes(variant);
  const typography = theme.typography as any;
  const getFont = hasResponsive && typography[variant][key]
    ? typography[variant][key]
    : typography[variant];
  const fontSize = remToPx(getFont.fontSize);
  const lineHeight = Number(typography[variant].lineHeight) * fontSize;
  const { fontWeight, letterSpacing } = typography[variant];
  return { fontSize, lineHeight, fontWeight, letterSpacing };
}
