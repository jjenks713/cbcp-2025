import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import ReactLightbox, { useLightboxState } from 'yet-another-react-lightbox';

import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import ZoomIn from '@mui/icons-material/ZoomIn';
import ZoomOut from '@mui/icons-material/ZoomOut';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

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
          iconClose: () => <CloseIcon sx={{ fontSize: ICON_SIZE }} />,
          iconZoomIn: () => <ZoomIn sx={{ fontSize: ICON_SIZE }} />,
          iconZoomOut: () => <ZoomOut sx={{ fontSize: ICON_SIZE }} />,
          iconPrev: () => <ChevronLeft sx={{ fontSize: ICON_SIZE + 8 }} />,
          iconNext: () => <ChevronRight sx={{ fontSize: ICON_SIZE + 8 }} />,
          iconExitFullscreen: () => <FullscreenExitIcon sx={{ fontSize: ICON_SIZE }} />,
          iconEnterFullscreen: () => <FullscreenIcon sx={{ fontSize: ICON_SIZE }} />,
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
