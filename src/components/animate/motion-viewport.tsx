import { motion as m, MotionProps } from 'framer-motion';

import Box, { BoxProps } from '@mui/material/Box';

import { useResponsive } from '../../hooks/use-responsive';
import { varContainer } from './variants';

type IProps = BoxProps & MotionProps;

interface Props extends IProps {
  children: React.ReactNode;
  disableAnimatedMobile?: boolean;
}

// Wrap a section's content in this to have it (and any direct children
// using a varFade()/varZoom() variant) animate in once, the first time it
// scrolls into view — rather than animating immediately on page load like
// MotionContainer does.
export default function MotionViewport({
  children,
  disableAnimatedMobile = true,
  ...other
}: Props) {
  const smDown = useResponsive('down', 'sm');

  if (smDown && disableAnimatedMobile) {
    return <Box {...other}>{children}</Box>;
  }

  return (
    <Box
      component={m.div}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
      variants={varContainer()}
      {...other}
    >
      {children}
    </Box>
  );
}
