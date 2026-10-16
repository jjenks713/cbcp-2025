// The confetti pattern behind the app (App/Layout.tsx), pinned to the viewport.
export const BACKGROUND_PATTERN = '/assets/background/confet.png';
export const BACKGROUND_PATTERN_OPACITY = 0.2;

/** sx for a layer showing the pattern, fixed to the viewport. */
export const backgroundPatternLayer = {
  pointerEvents: 'none',
  opacity: BACKGROUND_PATTERN_OPACITY,
  backgroundImage: `url(${BACKGROUND_PATTERN})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
} as const;
