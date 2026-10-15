import type { Variants } from 'framer-motion';

export const varHover = (scale = 1.1): Variants => ({
  hover: { scale },
});

export const varTranHover = () => ({
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
  duration: 0.3,
});
