import { VariantsType } from '../types';
import { varTranEnter } from './transition';

// Entrance-only (no `exit`) — these drive scroll-into-view reveals via
// MotionViewport's `whileInView`, which never plays an exit transition.
export const varFade = (props?: VariantsType) => {
  const distance = props?.distance || 80;
  const durationIn = props?.durationIn;
  const easeIn = props?.easeIn;

  return {
    in: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: varTranEnter({ durationIn, easeIn }) },
    },
    inUp: {
      initial: { y: distance, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: varTranEnter({ durationIn, easeIn }) },
    },
    inDown: {
      initial: { y: -distance, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: varTranEnter({ durationIn, easeIn }) },
    },
    inLeft: {
      initial: { x: -distance, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: varTranEnter({ durationIn, easeIn }) },
    },
    inRight: {
      initial: { x: distance, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: varTranEnter({ durationIn, easeIn }) },
    },
  };
};
