import { useEffect, useState } from 'react';

import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';

import { scrollToTopAndReset } from '../../lib/scrollReset';

const SCROLL_THRESHOLD = 400;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Zoom in={visible}>
      <Fab
        color="primary"
        size="medium"
        onClick={scrollToTopAndReset}
        aria-label="Back to top"
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          // Below the artwork modal's backdrop (zIndex 1300) so it's
          // covered rather than floating on top while the modal is open.
          zIndex: 1100,
        }}
      >
        <KeyboardArrowUp />
      </Fab>
    </Zoom>
  );
}
