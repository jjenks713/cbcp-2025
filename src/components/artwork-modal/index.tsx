import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Portal from '@mui/material/Portal';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import ArtworkModalCarousel from './artwork-modal-carousel';
import { type ArtItem } from '../../lib/contentful';

type Props = {
  item: ArtItem | null;
  open: boolean;
  onClose: () => void;
};

export default function ArtworkModal({ item, open, onClose }: Props) {
  // `item` goes null the instant `open` does (the URL param clears
  // immediately on close), which would blank the content mid-exit — so we
  // keep showing the last real item while the exit animation plays.
  const [displayedItem, setDisplayedItem] = useState<ArtItem | null>(item);

  useEffect(() => {
    if (item) setDisplayedItem(item);
  }, [item]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  const show = open && !!displayedItem;
  const images = displayedItem
    ? displayedItem.imageUrls && displayedItem.imageUrls.length > 0
      ? displayedItem.imageUrls
      : [displayedItem.coverUrl]
    : [];
  const details = displayedItem
    ? [
        { label: 'Medium', value: displayedItem.medium },
        { label: 'Size', value: displayedItem.size },
        { label: 'Edition', value: displayedItem.edition },
      ].filter((row) => row.value)
    : [];

  return (
    // Portaled to <body> because Layout wraps page content in its own
    // stacking context (zIndex 1), which would otherwise trap the modal
    // beneath the sticky nav no matter how high its zIndex.
    <Portal>
    <AnimatePresence>
      {show && displayedItem && (
        <>
          <motion.div
            key={`backdrop-${displayedItem.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              background: 'rgba(0, 0, 0, 0.72)',
            }}
          />

          <Box
            // Keyed per-item (along with the backdrop above) so closing one
            // piece and opening a different one is a real unmount + mount
            // in AnimatePresence's eyes — without this, switching items
            // just updates `layoutId` on the same persisting instance, and
            // Framer Motion keeps animating from the *previous* item's
            // thumbnail instead of the new one's.
            key={displayedItem.id}
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 1301,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 0, md: 3 },
              pointerEvents: 'none',
            }}
          >
            {/*
              Sharing this layoutId with the clicked thumbnail (see
              GalleryItem in Gallery.tsx) is what makes the modal grow open
              from the image instead of just fading/scaling in from the
              center — Framer Motion animates between the two elements'
              actual on-screen rects automatically.
            */}
            <Box
              component={motion.div}
              layoutId={`artwork-${displayedItem.id}`}
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: 'relative',
                pointerEvents: 'auto',
                // A fixed desktop width (not "auto") is required here — the
                // image/info children below split 55%/45%, and percentage
                // widths can't resolve against a shrink-to-fit flex parent.
                width: { xs: 1, md: 900 },
                height: { xs: 1, md: 'auto' },
                maxWidth: { md: 'calc(100vw - 48px)' },
                maxHeight: { xs: 1, md: '85vh' },
                overflow: 'auto',
                bgcolor: 'secondary.main',
                borderRadius: { xs: 0, md: 2 },
                display: { md: 'flex' },
              }}
            >
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  zIndex: 9,
                  color: 'common.white',
                  bgcolor: (theme) => `${theme.palette.grey[900]}80`,
                  '&:hover': { bgcolor: (theme) => `${theme.palette.grey[900]}B0` },
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>

              <ArtworkModalCarousel title={displayedItem.title} images={images} />

              <Stack spacing={2} sx={{ width: { md: '45%' }, p: { xs: 3, md: 4 } }}>
                {displayedItem.categories && displayedItem.categories.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {displayedItem.categories.map((cat) => (
                      <Chip key={cat} label={cat} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                )}

                <Typography variant="h4">{displayedItem.title}</Typography>

                {displayedItem.description && (
                  <Typography sx={{ color: 'text.secondary' }}>{displayedItem.description}</Typography>
                )}

                {details.length > 0 && (
                  <>
                    <Divider sx={{ borderStyle: 'dashed' }} />
                    <Stack spacing={1}>
                      {details.map((row) => (
                        <Stack key={row.label} direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {row.label}
                          </Typography>
                          <Typography variant="body2">{row.value}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </AnimatePresence>
    </Portal>
  );
}
