import { VariantsType } from '../types';
import { varTranEnter } from './transition';

// Entrance-only "tiny to big" reveal — distance is much smaller than a
// typical page-transition zoom since this nudges a card/image into place
// within a section, not flying it in from off-screen.
export const varZoom = (props?: VariantsType) => {
  const distance = props?.distance || 40;
  const durationIn = props?.durationIn;
  const easeIn = props?.easeIn;

  return {
    in: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1, transition: varTranEnter({ durationIn, easeIn }) },
    },
    inUp: {
      initial: { scale: 0.8, opacity: 0, y: distance },
      animate: { scale: 1, opacity: 1, y: 0, transition: varTranEnter({ durationIn, easeIn }) },
    },
  };
};
