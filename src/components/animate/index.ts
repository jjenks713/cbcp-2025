import type { Variants } from 'framer-motion';

export * from './variants';
export { default as MotionViewport } from './motion-viewport';

// Not part of the ported variant set below — a small hover-only helper
// used for the gallery image zoom-on-hover effect.
export const varHover = (scale = 1.1): Variants => ({
  hover: { scale },
});
