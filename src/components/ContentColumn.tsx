import Box, { type BoxProps } from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

// Page content (MUI Container, 1200px) sits in the middle of the column;
// the extra width either side is where the background fades out.
const MAX_WIDTH = 1400;
const FADE = 100;

// The centered column page content sits in, so text and pictures read
// clearly over the app's confetti background pattern (see
// App/Layout.tsx). Its background is 75% (not element opacity - content
// stays fully opaque) and, on screens wide enough to have margins, fades
// to transparent at the left and right so there's no hard edge.
// Full-width banners (e.g. the home page hero) go outside it.
export default function ContentColumn({ sx, ...other }: BoxProps) {
  return (
    <Box
      sx={[
        (theme) => {
          const panel = alpha(theme.palette.secondary.main, 0.75);
          return {
            width: 1,
            maxWidth: MAX_WIDTH,
            mx: 'auto',
            background: panel,
            // Only once the screen is wider than the column - below that
            // the content runs close to the edges and needs the full panel.
            [`@media (min-width: ${MAX_WIDTH}px)`]: {
              background: `linear-gradient(to right, transparent 0, ${panel} ${FADE}px, ${panel} calc(100% - ${FADE}px), transparent 100%)`,
            },
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}
