import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import ReactLightbox, { useLightboxState } from 'yet-another-react-lightbox';

import Box from '@mui/material/Box';

import Iconify from '../iconify';

import StyledLightbox from './styles';
import { LightBoxProps } from './types';

const ICON_SIZE = 24;

export default function Lightbox({
  slides,
  disabledZoom,
  disabledTotal,
  disabledCaptions,
  disabledThumbnails,
  disabledFullscreen,
  onGetCurrentIndex,
  ...other
}: LightBoxProps) {
  const totalItems = slides ? slides.length : 0;

  return (
    <>
      <StyledLightbox />

      <ReactLightbox
        slides={slides}
        animation={{ swipe: 240 }}
        carousel={{ finite: totalItems < 5 }}
        controller={{ closeOnBackdropClick: true }}
        plugins={getPlugins({ disabledZoom, disabledCaptions, disabledThumbnails, disabledFullscreen })}
        on={{
          view: ({ index }: { index: number }) => {
            if (onGetCurrentIndex) {
              onGetCurrentIndex(index);
            }
          },
        }}
        toolbar={{
          buttons: [
            <DisplayTotal key={0} totalItems={totalItems} disabledTotal={disabledTotal} />,
            'close',
          ],
        }}
        render={{
          iconClose: () => <Iconify width={ICON_SIZE} icon="carbon:close" />,
          iconZoomIn: () => <Iconify width={ICON_SIZE} icon="carbon:zoom-in" />,
          iconZoomOut: () => <Iconify width={ICON_SIZE} icon="carbon:zoom-out" />,
          iconPrev: () => <Iconify width={ICON_SIZE + 8} icon="carbon:chevron-left" />,
          iconNext: () => <Iconify width={ICON_SIZE + 8} icon="carbon:chevron-right" />,
          iconExitFullscreen: () => <Iconify width={ICON_SIZE} icon="carbon:center-to-fit" />,
          iconEnterFullscreen: () => <Iconify width={ICON_SIZE} icon="carbon:fit-to-screen" />,
        }}
        {...other}
      />
    </>
  );
}

export function getPlugins({
  disabledZoom,
  disabledCaptions,
  disabledThumbnails,
  disabledFullscreen,
}: LightBoxProps) {
  let plugins = [Captions, Fullscreen, Thumbnails, Zoom];

  if (disabledThumbnails) {
    plugins = plugins.filter((plugin) => plugin !== Thumbnails);
  }
  if (disabledCaptions) {
    plugins = plugins.filter((plugin) => plugin !== Captions);
  }
  if (disabledFullscreen) {
    plugins = plugins.filter((plugin) => plugin !== Fullscreen);
  }
  if (disabledZoom) {
    plugins = plugins.filter((plugin) => plugin !== Zoom);
  }

  return plugins;
}

type DisplayTotalProps = {
  totalItems: number;
  disabledTotal?: boolean;
};

export function DisplayTotal({ totalItems, disabledTotal }: DisplayTotalProps) {
  const { currentIndex } = useLightboxState();

  if (disabledTotal) {
    return null;
  }

  return (
    <Box
      component="span"
      className="yarl__button"
      sx={{
        typography: 'body2',
        alignItems: 'center',
        display: 'inline-flex',
        justifyContent: 'center',
      }}
    >
      <strong> {currentIndex + 1} </strong> / {totalItems}
    </Box>
  );
}
